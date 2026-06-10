import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  getAuthFailureCount,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import {
  isDuplicateEmailSignUp,
  resendSignupConfirmation,
  resolveEmailConfirmRedirect,
} from "@/lib/auth/email-confirmation";
import {
  RESEND_CONFIRMATION_MSG,
  SIGN_UP_GENERIC_MSG,
  CAPTCHA_REQUIRED_MSG,
} from "@/lib/auth/safe-auth-messages";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { safeLog } from "@/lib/security/safeLog";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

type ResendBody = {
  email?: string;
  turnstileToken?: string;
};

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-fail-resend");

  let body: ResendBody;
  try {
    body = (await req.json()) as ResendBody;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-resend-confirmation"),
    RL.authSignUp.limit,
    RL.authSignUp.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
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

  const { supabase } = client;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Укажите email." }, { status: 400 });
  }

  const emailRedirectTo = resolveEmailConfirmRedirect(req, "/app");

  try {
    const result = await resendSignupConfirmation(supabase, email, emailRedirectTo);
    if (!result.ok) {
      await recordAuthFailure(failKey);
      const net = isLikelySupabaseNetworkError(result.error ?? "");
      return NextResponse.json(
        {
          error: translateAuthError(result.error ?? "Не удалось отправить письмо.", "sign-up"),
          requiresCaptcha: (await getAuthFailureCount(failKey)) >= 3,
        },
        { status: net ? 502 : 400 },
      );
    }

    await clearAuthFailures(failKey);
    return NextResponse.json({ ok: true, message: RESEND_CONFIRMATION_MSG });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    const net = isLikelySupabaseNetworkError(msg);
    return NextResponse.json(
      {
        error: translateAuthError(msg, "sign-up"),
        requiresCaptcha: await isCaptchaRequired(failKey),
      },
      { status: net ? 502 : 400 },
    );
  }
}
