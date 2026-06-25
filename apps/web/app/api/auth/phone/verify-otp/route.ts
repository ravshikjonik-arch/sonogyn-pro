import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { formatSupabaseAuthError } from "@/lib/auth/auth-error-text";
import { translatePhoneAuthError } from "@/lib/auth/phone-auth-errors";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import {
  applyRegistrationMetadata,
  isValidPhoneE164,
  parseRegistrationMetadata,
} from "@/lib/auth/registration-metadata";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import { isAuthEmailOnly, disabledAuthMethodResponse } from "@/lib/auth/auth-methods-config";
import { isCustomSmsAuthEnabled } from "@/lib/auth/sms-providers";
import {
  ensurePhoneAuthUser,
  establishPhoneAuthSession,
} from "@/lib/auth/phone-custom-auth";
import {
  parseJsonBody,
  PhoneVerifyOtpBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { logError } from "@/services/logger";

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-phone-verify-fail");

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = PhoneVerifyOtpBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user: sessionUser },
  } = await client.supabase.auth.getUser();

  const isLinkPhoneFlow = Boolean(sessionUser) && body.createUser !== true;
  if (isAuthEmailOnly() && !isLinkPhoneFlow) return disabledAuthMethodResponse("phone");

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-phone-verify"),
    RL.authPhoneVerify.limit,
    RL.authPhoneVerify.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
  const tokenRaw =
    typeof body.token === "string"
      ? body.token
      : typeof body.code === "string"
        ? body.code
        : "";
  const token = tokenRaw.trim();
  const registrationMeta = parseRegistrationMetadata(body);

  if (!phone || !token) {
    return NextResponse.json({ error: "Укажите телефон и код." }, { status: 400 });
  }
  if (!isValidPhoneE164(phone)) {
    return NextResponse.json(
      { error: "Неверный формат номера. Используйте +79001234567." },
      { status: 400 },
    );
  }

  if (sessionUser && body.createUser !== true) {
    try {
      const { verifyLinkPhoneOtp } = await import("@/lib/auth/link-phone");
      const { phoneVerifiedMetadataPatch } = await import("@/lib/auth/phone-verified");
      const linked = await verifyLinkPhoneOtp({
        user: sessionUser,
        phoneE164: phone,
        code: token,
      });
      if (!linked.ok) {
        await recordAuthFailure(failKey);
        return NextResponse.json({ error: linked.error }, { status: linked.status ?? 401 });
      }
      const { error: metaError } = await client.supabase.auth.updateUser({
        data: { ...phoneVerifiedMetadataPatch(), phone_e164: phone },
      });
      if (metaError) {
        logError("phone/verify-otp: updateUser metadata failed", metaError, {
          context: { userId: sessionUser.id },
        });
        await recordAuthFailure(failKey);
        return NextResponse.json({ error: "Не удалось обновить профиль." }, { status: 500 });
      }
      await clearAuthFailures(failKey);
      return nextJsonWithAuthCookies({ ok: true, phoneVerified: true, linkPhone: true }, client.cookiesToSet);
    } catch (e) {
      await recordAuthFailure(failKey);
      logError("phone/verify-otp: link phone exception", e, { context: { userId: sessionUser.id } });
      return NextResponse.json({ error: "Не удалось подтвердить номер." }, { status: 500 });
    }
  }

  const wantsMobileSession = req.headers.get("x-sonogyn-client") === "mobile";
  const isRegistration = body.createUser === true || Boolean(registrationMeta.full_name);
  const purpose = isRegistration ? "register" : "login";

  if (isCustomSmsAuthEnabled()) {
    const codeOk = await verifyStoredCode({ purpose, contact: phone, code: token });
    if (!codeOk) {
      await recordAuthFailure(failKey);
      return NextResponse.json({ error: "Неверный или просроченный код." }, { status: 401 });
    }

    const ensured = await ensurePhoneAuthUser({
      phoneE164: phone,
      registration: registrationMeta,
      // OTP verified — phone ownership proven; provision account if deleted / first SMS login.
      createUser: true,
    });
    if ("error" in ensured) {
      return NextResponse.json(
        { error: ensured.error, needsRegistration: ensured.needsRegistration },
        { status: ensured.needsRegistration ? 400 : 500 },
      );
    }

    await clearAuthFailures(failKey);
    return establishPhoneAuthSession(ensured.email, req, ensured.userId, registrationMeta, phone);
  }

  try {
    const { data, error } = await client.supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      await recordAuthFailure(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      const mapped = translatePhoneAuthError(
        formatSupabaseAuthError(error),
        isRegistration ? "register" : "login",
      );
      return NextResponse.json(
        {
          error: mapped.message,
          needsRegistration: mapped.needsRegistration,
          smsNotConfigured: mapped.smsNotConfigured,
        },
        { status: net ? 502 : 401 },
      );
    }

    const userId = data.user?.id;
    if (userId && registrationMeta.full_name) {
      await applyRegistrationMetadata(client.supabase, userId, registrationMeta);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    logError("phone/verify-otp: исключение при проверке OTP", e, {
      channel: "sms",
      context: { isRegistration },
    });
    const mapped = translatePhoneAuthError(msg, isRegistration ? "register" : "login");
    return NextResponse.json(
      { error: mapped.message, smsNotConfigured: mapped.smsNotConfigured },
      { status: 502 },
    );
  }

  await clearAuthFailures(failKey);

  if (wantsMobileSession) {
    const { data: sessionData } = await client.supabase.auth.getSession();
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

  return nextJsonWithAuthCookies({ ok: true }, client.cookiesToSet);
}
