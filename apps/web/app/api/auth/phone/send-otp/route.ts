import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  getAuthFailureCount,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { CAPTCHA_REQUIRED_MSG, PHONE_OTP_SENT_MSG } from "@/lib/auth/safe-auth-messages";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
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

type Body = {
  phone?: string;
  createUser?: boolean;
  turnstileToken?: string;
  full_name?: string;
  preferred_locale?: string;
  specialization?: string;
  institution?: string;
};

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-phone-fail");

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

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

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
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

  const registrationMeta = parseRegistrationMetadata(body);
  if (body.createUser && !registrationMeta.full_name) {
    return NextResponse.json(
      { error: "Укажите имя и фамилию (полное имя специалиста)." },
      { status: 400 },
    );
  }

  const userData = registrationMetadataToUserData(registrationMeta);

  try {
    const { error } = await client.supabase.auth.signInWithOtp({
      phone,
      options: {
        ...(body.createUser ? { shouldCreateUser: true } : {}),
        ...(Object.keys(userData).length > 0 ? { data: userData } : {}),
      },
    });

    if (error) {
      await recordAuthFailure(failKey);
      const failCount = await getAuthFailureCount(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      return NextResponse.json(
        {
          error: translateAuthError(error.message, "otp"),
          requiresCaptcha: failCount >= 3,
        },
        { status: net ? 502 : 400 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    return NextResponse.json(
      { error: translateAuthError(msg, "otp"), requiresCaptcha: await isCaptchaRequired(failKey) },
      { status: 502 },
    );
  }

  await clearAuthFailures(failKey);
  return NextResponse.json({ ok: true, message: PHONE_OTP_SENT_MSG });
}
