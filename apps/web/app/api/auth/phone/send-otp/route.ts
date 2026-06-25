import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  getAuthFailureCount,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { CAPTCHA_REQUIRED_MSG, PHONE_OTP_SENT_MSG } from "@/lib/auth/safe-auth-messages";
import { formatSupabaseAuthError } from "@/lib/auth/auth-error-text";
import { translatePhoneAuthError, phoneAuthNeedsRegistration } from "@/lib/auth/phone-auth-errors";
import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import {
  isValidPhoneE164,
  parseRegistrationMetadata,
  registrationMetadataToUserData,
} from "@/lib/auth/registration-metadata";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import { runVerificationFallbackChain } from "@/lib/auth/verification/fallback-handler";
import { parseEmailContact } from "@/lib/auth/verification/validate-contact";
import { logVerificationEvent } from "@/lib/auth/verification/safe-verification-log";
import { checkRateLimit } from "@/lib/auth/verification/verification-rate-limit";
import { isAuthEmailOnly, disabledAuthMethodResponse } from "@/lib/auth/auth-methods-config";
import { shouldExposeDevSmsOtp } from "@/lib/auth/dev-sms";
import { isCustomSmsAuthEnabled, resolveSmsProvider } from "@/lib/auth/sms-providers";
import {
  parseJsonBody,
  PhoneSendOtpBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { logError } from "@/services/logger";

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-phone-fail");

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = PhoneSendOtpBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user: sessionUser },
  } = await client.supabase.auth.getUser();

  /** /verify-phone: привязка номера после Google/email — не блокируем AUTH_EMAIL_ONLY. */
  const isLinkPhoneFlow = Boolean(sessionUser) && body.createUser !== true;
  if (isAuthEmailOnly() && !isLinkPhoneFlow) return disabledAuthMethodResponse("phone");

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-phone-send"),
    RL.authPhoneSend.limit,
    RL.authPhoneSend.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова.", requiresCaptcha: true },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  if (await isCaptchaRequired(failKey)) {
    const ok = await verifyTurnstileIfConfigured(body.turnstileToken);
    if (!ok) {
      return NextResponse.json(
        { error: CAPTCHA_REQUIRED_MSG, requiresCaptcha: true },
        { status: 403 },
      );
    }
  }

  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
  if (!phone) {
    return NextResponse.json({ error: "Укажите номер телефона." }, { status: 400 });
  }
  if (!isValidPhoneE164(phone)) {
    return NextResponse.json(
      { error: "Неверный формат номера. Используйте +79001234567." },
      { status: 400 },
    );
  }

  /** Привязка телефона к Google / email / Telegram аккаунту. */
  if (sessionUser && body.createUser !== true) {
    const { sendLinkPhoneOtp } = await import("@/lib/auth/link-phone");
    const link = await sendLinkPhoneOtp({
      user: sessionUser,
      phoneE164: phone,
      idempotencyKey: req.headers.get("Idempotency-Key"),
    });
    if (!link.ok) {
      return NextResponse.json(
        { error: link.error, retryAfterSec: link.retryAfterSec },
        { status: link.status ?? 400 },
      );
    }
    await clearAuthFailures(failKey);
    return NextResponse.json({
      ok: true,
      message: link.message,
      linkPhone: true,
      ...(shouldExposeDevSmsOtp() && link.devOtp ? { devOtp: link.devOtp } : {}),
    });
  }

  const phoneContactRl = await checkRateLimit("sms", phone);
  if (!phoneContactRl.ok) {
    return NextResponse.json(
      {
        error: `Слишком много кодов на этот номер. Повторите через ${phoneContactRl.retryAfterSec} сек.`,
        retryAfterSec: phoneContactRl.retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(phoneContactRl.retryAfterSec) } },
    );
  }

  const registrationMeta = parseRegistrationMetadata(body);
  if (body.createUser && !registrationMeta.full_name) {
    return NextResponse.json(
      { error: "Укажите имя и фамилию (полное имя специалиста)." },
      { status: 400 },
    );
  }

  const isRegistration = body.createUser === true;
  const userData = registrationMetadataToUserData(registrationMeta);

  // SMS.ru / Twilio через наш pipeline (без Supabase Phone + Twilio).
  if (isCustomSmsAuthEnabled()) {
    const fallbackEmail =
      typeof body.fallbackEmail === "string" ? parseEmailContact(body.fallbackEmail) : null;
    const fb = await runVerificationFallbackChain({
      primaryMethod: "sms",
      contact: phone,
      purpose: isRegistration ? "register" : "login",
      fallbackEmail: fallbackEmail ?? undefined,
      idempotencyKey: req.headers.get("Idempotency-Key"),
    });
    if (fb.ok) {
      logVerificationEvent("custom_sms_sent", {
        method: resolveSmsProvider() ?? undefined,
        purpose: isRegistration ? "register" : "login",
      });
      await clearAuthFailures(failKey);
      return NextResponse.json({
        ok: true,
        message: fb.message ?? PHONE_OTP_SENT_MSG,
        fallbackUsed: fb.fallbackUsed ?? false,
        deliveredVia: fb.deliveredVia ?? "sms",
        customSms: true,
        ...(shouldExposeDevSmsOtp() && fb.devOtp ? { devOtp: fb.devOtp } : {}),
      });
    }
    await recordAuthFailure(failKey);
    logError("phone/send-otp: SMS-провайдер не доставил код", fb.message, {
      channel: "sms",
      context: { errorCode: fb.errorCode, provider: resolveSmsProvider() ?? undefined },
    });
    return NextResponse.json(
      {
        error: fb.message ?? "Не удалось отправить SMS.",
        smsNotConfigured: fb.errorCode === "sms_not_configured",
        requiresCaptcha: await isCaptchaRequired(failKey),
      },
      { status: 502 },
    );
  }

  try {
    const { error } = await client.supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: isRegistration,
        ...(Object.keys(userData).length > 0 ? { data: userData } : {}),
      },
    });

    if (error) {
      await recordAuthFailure(failKey);
      const failCount = await getAuthFailureCount(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      const mapped = translatePhoneAuthError(
        formatSupabaseAuthError(error),
        isRegistration ? "register" : "login",
      );

      // Fallback chain: Supabase SMS недоступен → наш send-code pipeline на email.
      const fallbackEmail =
        typeof body.fallbackEmail === "string" ? parseEmailContact(body.fallbackEmail) : null;
      if (fallbackEmail && (mapped.smsNotConfigured || net)) {
        const fb = await runVerificationFallbackChain({
          primaryMethod: "sms",
          contact: phone,
          purpose: isRegistration ? "register" : "login",
          fallbackEmail,
          idempotencyKey: req.headers.get("Idempotency-Key"),
        });
        if (fb.ok) {
          logVerificationEvent("supabase_sms_fallback_ok", {
            purpose: isRegistration ? "register" : "login",
            fallbackUsed: Boolean(fb.fallbackUsed),
          });
          await clearAuthFailures(failKey);
          return NextResponse.json({
            ok: true,
            message: fb.message ?? PHONE_OTP_SENT_MSG,
            fallbackUsed: fb.fallbackUsed ?? true,
            deliveredVia: fb.deliveredVia,
          });
        }
      }

      return NextResponse.json(
        {
          error: mapped.message,
          needsRegistration: mapped.needsRegistration ?? (!isRegistration && phoneAuthNeedsRegistration(error.message)),
          smsNotConfigured: mapped.smsNotConfigured,
          requiresCaptcha: failCount >= 3,
        },
        { status: net ? 502 : 400 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    logError("phone/send-otp: исключение при отправке OTP", e, {
      channel: "sms",
      context: { isRegistration },
    });
    const mapped = translatePhoneAuthError(msg, isRegistration ? "register" : "login");
    return NextResponse.json(
      {
        error: mapped.message,
        needsRegistration: mapped.needsRegistration ?? (!isRegistration && phoneAuthNeedsRegistration(msg)),
        smsNotConfigured: mapped.smsNotConfigured,
        requiresCaptcha: await isCaptchaRequired(failKey),
      },
      { status: 502 },
    );
  }

  await clearAuthFailures(failKey);
  return NextResponse.json({ ok: true, message: PHONE_OTP_SENT_MSG });
}
