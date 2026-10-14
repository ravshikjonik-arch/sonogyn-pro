import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import { confirmUserEmail, shouldAutoConfirmEmail } from "@/lib/auth/auto-confirm-email";
import { autoGrantPilotMedicalAccess } from "@/lib/auth/pilot-medical-access";
import { resolveUserIdByEmail } from "@/lib/auth/resolve-user-by-email";
import {
  clearAuthFailures,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { toSafeAuthErrorMessage, CAPTCHA_REQUIRED_MSG } from "@/lib/auth/safe-auth-messages";
import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import {
  parseJsonBody,
  SignInBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";
import {
  E2E_AUTH_COOKIE,
  e2eStubAuthCookieOptions,
  e2eStubValidateSignIn,
} from "@/lib/e2e/auth-stub";
import { isE2eCiStubMode } from "@/lib/e2e/ci-stub";

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-fail");

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = SignInBodySchema.safeParse(raw.data);
  if (!parsed.success) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "sign-in.bad_payload",
      success: false,
      metadata: { zodErrors: parsed.error.flatten().fieldErrors },
    });
    return zodErrorResponse(parsed.error);
  }

  const body = parsed.data;

  if (isE2eCiStubMode()) {
    const stub = e2eStubValidateSignIn(body.email, body.password);
    if (!stub.ok) {
      return NextResponse.json({ error: stub.error }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(E2E_AUTH_COOKIE, stub.role, e2eStubAuthCookieOptions());
    return response;
  }

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-sign-in"),
    RL.authSignIn.limit,
    RL.authSignIn.windowMs,
  );
  if (!rl.ok) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "sign-in.rate_limited",
      success: false,
      metadata: { retryAfterSec: rl.retryAfterSec },
    });
    return NextResponse.json(
      { error: "Слишком много попыток входа. Подождите и попробуйте снова.", requiresCaptcha: true },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  if (await isCaptchaRequired(failKey)) {
    const ok = await verifyTurnstileIfConfigured(body.turnstileToken);
    if (!ok) {
      await writeSecurityAuditLog({
        category: "auth",
        action: "sign-in.captcha_required",
        success: false,
      });
      return NextResponse.json(
        { error: CAPTCHA_REQUIRED_MSG, requiresCaptcha: true },
        { status: 403 },
      );
    }
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;

  const { email, password } = body;

  const wantsMobileSession = req.headers.get("x-sonogyn-client") === "mobile";

  try {
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error && /email not confirmed/i.test(error.message) && shouldAutoConfirmEmail()) {
      const userId = await resolveUserIdByEmail(email);
      if (userId && (await confirmUserEmail(userId))) {
        const retry = await supabase.auth.signInWithPassword({ email, password });
        error = retry.error;
      }
    }

    if (error) {
      const failCount = await recordAuthFailure(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      const needsEmailConfirmation = /email not confirmed/i.test(error.message);
      await writeSecurityAuditLog({
        category: "auth",
        action: "sign-in.invalid_credentials",
        success: false,
        metadata: {
          needsEmailConfirmation,
          rateLimited: failCount >= 3,
        },
      });
      return NextResponse.json(
        {
          error: toSafeAuthErrorMessage(error.message, "sign-in"),
          requiresCaptcha: failCount >= 3,
          needsEmailConfirmation,
        },
        { status: net ? 502 : 401 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    const net = isLikelySupabaseNetworkError(msg);
    await writeSecurityAuditLog({
      category: "auth",
      action: "sign-in.exception",
      success: false,
      metadata: { message: msg },
    });
    return NextResponse.json(
      {
        error: toSafeAuthErrorMessage(msg, "sign-in"),
        requiresCaptcha: await isCaptchaRequired(failKey),
      },
      { status: net ? 502 : 401 },
    );
  }

  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aalError && aalData?.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (!factorsError) {
      const totp = (factorsData?.totp ?? []).find((f) => f.status === "verified");
      if (totp) {
        if (wantsMobileSession) {
          const { data: sessionData } = await supabase.auth.getSession();
          return NextResponse.json({
            ok: true,
            needsMfa: true,
            factorId: totp.id,
            session: sessionData.session
              ? {
                  access_token: sessionData.session.access_token,
                  refresh_token: sessionData.session.refresh_token,
                }
              : undefined,
          });
        }
        return nextJsonWithAuthCookies(
          { ok: true, needsMfa: true, factorId: totp.id },
          cookiesToSet,
        );
      }
    }
  }

  await clearAuthFailures(failKey);

  const {
    data: { user: signedInUser },
  } = await supabase.auth.getUser();
  if (signedInUser?.id) {
    await autoGrantPilotMedicalAccess(signedInUser.id);
  }

  if (wantsMobileSession) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      return NextResponse.json({
        ok: true,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        },
      });
    }
  }

  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
