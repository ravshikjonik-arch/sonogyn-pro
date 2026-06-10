import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { SIGN_UP_GENERIC_MSG, CAPTCHA_REQUIRED_MSG } from "@/lib/auth/safe-auth-messages";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { buildOAuthRedirect } from "@/lib/auth/oauth-providers";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

type SignUpBody = {
  email?: string;
  password?: string;
  full_name?: string;
  specialization?: string;
  institution?: string;
  preferred_locale?: string;
  turnstileToken?: string;
};

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-fail-signup");

  let body: SignUpBody;
  try {
    body = (await req.json()) as SignUpBody;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-sign-up"),
    RL.authSignUp.limit,
    RL.authSignUp.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток регистрации. Попробуйте позже.", requiresCaptcha: true },
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

  const { supabase, cookiesToSet } = client;

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const specialization = typeof body.specialization === "string" ? body.specialization.trim() : "";
  const institution = typeof body.institution === "string" ? body.institution.trim() : "";
  const preferred_locale = typeof body.preferred_locale === "string" ? body.preferred_locale.trim() : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 });
  }

  if (!full_name) {
    return NextResponse.json({ error: "Укажите имя и фамилию (полное имя специалиста)." }, { status: 400 });
  }

  const wantsMobileSession = req.headers.get("x-sonogyn-client") === "mobile";
  const appOrigin = resolveAppOrigin(req);
  const emailRedirectTo = buildOAuthRedirect(appOrigin, "/app");

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name,
          ...(specialization ? { specialization } : {}),
          ...(institution ? { institution } : {}),
          ...(preferred_locale ? { preferred_locale } : {}),
        },
      },
    });

    if (error) {
      const failCount = await recordAuthFailure(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      return NextResponse.json(
        {
          error: translateAuthError(error.message, "sign-up"),
          requiresCaptcha: failCount >= 3,
        },
        { status: net ? 502 : 400 },
      );
    }

    await clearAuthFailures(failKey);

    if (wantsMobileSession && data.session) {
      return NextResponse.json({
        ok: true,
        needsEmailConfirmation: !data.session,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      });
    }

    return nextJsonWithAuthCookies(
      {
        ok: true,
        needsEmailConfirmation: !data.session,
        message: SIGN_UP_GENERIC_MSG,
      },
      cookiesToSet,
    );
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
