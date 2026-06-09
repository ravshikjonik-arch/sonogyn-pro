import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { toSafeAuthErrorMessage, CAPTCHA_REQUIRED_MSG } from "@/lib/auth/safe-auth-messages";
import { verifyTurnstileToken } from "@/lib/auth/verify-turnstile";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

type SignInBody = {
  email?: string;
  password?: string;
  turnstileToken?: string;
};

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-fail");

  let body: SignInBody;
  try {
    body = (await req.json()) as SignInBody;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const rl = await consumeRateLimit(rateLimitKeyFromRequest(req, "auth-sign-in"), 20, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток входа. Подождите и попробуйте снова.", requiresCaptcha: true },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  if (await isCaptchaRequired(failKey)) {
    const ok = await verifyTurnstileToken(body.turnstileToken);
    if (!ok) {
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

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 });
  }

  const wantsMobileSession = req.headers.get("x-sonogyn-client") === "mobile";

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const failCount = await recordAuthFailure(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      return NextResponse.json(
        {
          error: toSafeAuthErrorMessage(error.message, "sign-in"),
          requiresCaptcha: failCount >= 3,
        },
        { status: net ? 502 : 401 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    const net = isLikelySupabaseNetworkError(msg);
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
