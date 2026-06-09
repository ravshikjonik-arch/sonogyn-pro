import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  getAuthFailureCount,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { toSafeAuthErrorMessage, CAPTCHA_REQUIRED_MSG } from "@/lib/auth/safe-auth-messages";
import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

type Body = {
  phone?: string;
  createUser?: boolean;
  turnstileToken?: string;
};

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-phone-fail");

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const rl = await consumeRateLimit(rateLimitKeyFromRequest(req, "auth-phone-send"), 10, 15 * 60_000);
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

  try {
    const { error } = await client.supabase.auth.signInWithOtp({
      phone,
      options: body.createUser ? { shouldCreateUser: true } : undefined,
    });

    if (error) {
      await recordAuthFailure(failKey);
      const failCount = await getAuthFailureCount(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      return NextResponse.json(
        {
          error: toSafeAuthErrorMessage(error.message, "otp"),
          requiresCaptcha: failCount >= 3,
        },
        { status: net ? 502 : 400 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    return NextResponse.json(
      { error: toSafeAuthErrorMessage(msg, "otp"), requiresCaptcha: await isCaptchaRequired(failKey) },
      { status: 502 },
    );
  }

  await clearAuthFailures(failKey);
  return NextResponse.json({ ok: true, message: "Если номер подходит, код отправлен по SMS." });
}
