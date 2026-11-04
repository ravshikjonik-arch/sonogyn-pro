import { NextResponse } from "next/server";

import { birthDateErrorMessageForValue, parseBirthDateInput, parseBirthYearFromBody } from "@/lib/auth/birth-date";
import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  isCaptchaRequired,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import {
  isDuplicateEmailSignUp,
  resendSignupConfirmation,
  resolveEmailConfirmRedirect,
} from "@/lib/auth/email-confirmation";
import { TelegramService } from "@/services/telegram";
import {
  isUserEmailConfirmed,
  shouldAutoConfirmEmail,
  tryAutoConfirmRegistration,
} from "@/lib/auth/auto-confirm-email";
import { autoGrantPilotMedicalAccess } from "@/lib/auth/pilot-medical-access";
import { resolveUserIdByEmail } from "@/lib/auth/resolve-user-by-email";
import {
  CAPTCHA_REQUIRED_MSG,
  EMAIL_ALREADY_REGISTERED_MSG,
  RESEND_CONFIRMATION_MSG,
  SIGN_UP_GENERIC_MSG,
} from "@/lib/auth/safe-auth-messages";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import {
  parseJsonBody,
  SignUpBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { clientIpFromRequest, rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { safeLog } from "@/lib/security/safeLog";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";
import { isSmtpConfigured } from "@/lib/mail/smtp-config";
import { runVerificationFallbackChain } from "@/lib/auth/verification/fallback-handler";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";

async function finishSignUpResponse(params: {
  wantsMobileSession: boolean;
  needsEmailConfirmation: boolean;
  autoConfirmed?: boolean;
  emailOtpSent?: boolean;
  message?: string;
  cookiesToSet: Parameters<typeof nextJsonWithAuthCookies>[1];
  session?: { access_token: string; refresh_token: string };
}) {
  const payload = {
    ok: true as const,
    needsEmailConfirmation: params.needsEmailConfirmation,
    autoConfirmed: params.autoConfirmed,
    emailOtpSent: params.emailOtpSent,
    message: params.message,
    ...(params.session ? { session: params.session } : {}),
  };

  if (params.wantsMobileSession) return NextResponse.json(payload);
  return nextJsonWithAuthCookies(payload, params.cookiesToSet);
}

/** Письмо с 6-значным кодом через SMTP Mail.ru — надёжнее одной ссылки Supabase. */
async function sendSignupEmailOtp(
  email: string,
  clientIp?: string,
): Promise<{ ok: boolean; errorCode?: string; message?: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, errorCode: "email_not_configured", message: "SMTP не настроен." };
  }
  const result = await runVerificationFallbackChain({
    primaryMethod: "email",
    contact: email,
    purpose: "register",
    clientIp,
  });
  if (result.ok) return { ok: true };
  return {
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
  };
}

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-fail-signup");

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = SignUpBodySchema.safeParse(raw.data);
  if (!parsed.success) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "sign-up.bad_payload",
      success: false,
    });
    return zodErrorResponse(parsed.error);
  }

  const body = parsed.data;

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-sign-up"),
    RL.authSignUp.limit,
    RL.authSignUp.windowMs,
  );
  if (!rl.ok) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "sign-up.rate_limited",
      success: false,
      metadata: { retryAfterSec: rl.retryAfterSec },
    });
    return NextResponse.json(
      { error: "Слишком много попыток регистрации. Попробуйте позже.", requiresCaptcha: true },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  if (await isCaptchaRequired(failKey)) {
    const ok = await verifyTurnstileIfConfigured(body.turnstileToken);
    if (!ok) {
      await writeSecurityAuditLog({
        category: "auth",
        action: "sign-up.captcha_required",
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

  const {
    email,
    password,
    full_name,
    specialization,
    institution = "",
    preferred_locale = "",
    birth_date: birthDateRaw = "",
  } = body;
  const birth_year = parseBirthYearFromBody(body as Record<string, unknown>);
  const parsedBirth = birthDateRaw ? parseBirthDateInput(birthDateRaw) : null;
  const birth_date = parsedBirth?.iso ?? "";

  // Дата рождения опциональна на первом шаге; если передана — валидируем.
  if (birthDateRaw.trim() && (!birth_year || !birth_date)) {
    return NextResponse.json(
      { error: birthDateErrorMessageForValue(birthDateRaw) },
      { status: 400 },
    );
  }

  const wantsMobileSession = req.headers.get("x-sonogyn-client") === "mobile";
  const emailRedirectTo = resolveEmailConfirmRedirect(req, "/app");
  safeLog("auth:sign-up-redirect", { redirectTo: emailRedirectTo });

  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name,
          specialization,
          ...(birth_year ? { birth_year } : {}),
          ...(birth_date ? { birth_date } : {}),
          ...(institution ? { institution } : {}),
          ...(preferred_locale ? { preferred_locale } : {}),
        },
      },
    });

    if (error) {
      const failCount = await recordAuthFailure(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      safeLog("auth:sign-up-supabase-error", { message: error.message, net });
      await writeSecurityAuditLog({
        category: "auth",
        action: "sign-up.supabase_error",
        success: false,
        metadata: { net, message: error.message.slice(0, 160) },
      });
      return NextResponse.json(
        {
          error: translateAuthError(error.message, "sign-up"),
          requiresCaptcha: failCount >= 3,
        },
        { status: net ? 502 : 400 },
      );
    }

    await clearAuthFailures(failKey);

    if (data.user?.id && !isDuplicateEmailSignUp(data.user)) {
      TelegramService.notifyAdminsSafe("user.created", {
        userId: data.user.id,
        email,
        method: "email",
        name: full_name,
      });
    }

    const duplicate = isDuplicateEmailSignUp(data.user);
    if (duplicate) {
      const existingId = await resolveUserIdByEmail(email, sessionUser);

      if (shouldAutoConfirmEmail() && existingId) {
        if (await tryAutoConfirmRegistration({ supabase, userId: existingId, email, password })) {
          const { data: sessionData } = await supabase.auth.getSession();
          return finishSignUpResponse({
            wantsMobileSession,
            needsEmailConfirmation: false,
            autoConfirmed: true,
            message: "Аккаунт подтверждён. Вход выполнен.",
            cookiesToSet,
            session: sessionData.session
              ? {
                  access_token: sessionData.session.access_token,
                  refresh_token: sessionData.session.refresh_token,
                }
              : undefined,
          });
        }
      }

      // Уже подтверждённый email → не гоняем в OTP с «чужим» паролем; сразу вход / сброс.
      if (existingId && (await isUserEmailConfirmed(existingId))) {
        await writeSecurityAuditLog({
          category: "auth",
          action: "sign-up.already_registered",
          success: false,
          metadata: { userId: existingId },
        });
        return NextResponse.json(
          {
            ok: false,
            alreadyRegistered: true,
            error: EMAIL_ALREADY_REGISTERED_MSG,
          },
          { status: 409 },
        );
      }

      await resendSignupConfirmation(supabase, email, emailRedirectTo);
      const otp = await sendSignupEmailOtp(email, clientIpFromRequest(req));
      return finishSignUpResponse({
        wantsMobileSession,
        needsEmailConfirmation: true,
        emailOtpSent: otp.ok,
        message: otp.ok
          ? "Мы отправили код на почту (проверьте «Входящие» и «Спам»). Введите код ниже."
          : otp.errorCode === "smtp_app_password_required"
            ? "Аккаунт создан, но письмо с кодом не ушло: в SMTP_PASSWORD нужен пароль приложения Mail.ru (не обычный пароль). Пока откройте ссылку из письма Supabase или войдите через Telegram."
            : RESEND_CONFIRMATION_MSG,
        cookiesToSet,
      });
    }

    let needsEmailConfirmation = !data.session;

    if (needsEmailConfirmation && data.user?.id && shouldAutoConfirmEmail()) {
      const autoOk = await tryAutoConfirmRegistration({
        supabase,
        userId: data.user.id,
        email,
        password,
      });
      if (autoOk) {
        needsEmailConfirmation = false;
        await autoGrantPilotMedicalAccess(data.user.id);
        const { data: sessionData } = await supabase.auth.getSession();
        return finishSignUpResponse({
          wantsMobileSession,
          needsEmailConfirmation: false,
          autoConfirmed: true,
          message: "Регистрация завершена. Можно работать в кабинете.",
          cookiesToSet,
          session: sessionData.session
            ? {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
              }
            : undefined,
        });
      }
    }

    let emailOtpSent = false;
    let otpErrorCode: string | undefined;
    if (needsEmailConfirmation) {
      const otp = await sendSignupEmailOtp(email, clientIpFromRequest(req));
      emailOtpSent = otp.ok;
      otpErrorCode = otp.errorCode;
      // Если SMTP (Mail.ru) недоступен — не бросать врача: auto-confirm при флаге/dev.
      if (!emailOtpSent && data.user?.id && shouldAutoConfirmEmail()) {
        const autoOk = await tryAutoConfirmRegistration({
          supabase,
          userId: data.user.id,
          email,
          password,
        });
        if (autoOk) {
          needsEmailConfirmation = false;
          await autoGrantPilotMedicalAccess(data.user.id);
          const { data: sessionData } = await supabase.auth.getSession();
          return finishSignUpResponse({
            wantsMobileSession,
            needsEmailConfirmation: false,
            autoConfirmed: true,
            emailOtpSent: false,
            message:
              "Регистрация завершена (почта подтверждена автоматически: SMTP временно недоступен).",
            cookiesToSet,
            session: sessionData.session
              ? {
                  access_token: sessionData.session.access_token,
                  refresh_token: sessionData.session.refresh_token,
                }
              : undefined,
          });
        }
      }
    }

    if (wantsMobileSession && data.session) {
      return NextResponse.json({
        ok: true,
        needsEmailConfirmation,
        emailOtpSent,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      });
    }

    return nextJsonWithAuthCookies(
      {
        ok: true,
        needsEmailConfirmation,
        emailOtpSent,
        message: needsEmailConfirmation
          ? emailOtpSent
            ? "Мы отправили код на почту от Sonogyn-pro@mail.ru. Введите код ниже (и проверьте «Спам»)."
            : otpErrorCode === "smtp_app_password_required"
              ? "Аккаунт создан. Письмо с кодом не ушло: обновите SMTP_PASSWORD — пароль приложения Mail.ru. Пока используйте Telegram или ссылку из письма Supabase."
              : SIGN_UP_GENERIC_MSG
          : undefined,
      },
      cookiesToSet,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    const net = isLikelySupabaseNetworkError(msg);
    await writeSecurityAuditLog({
      category: "auth",
      action: "sign-up.exception",
      success: false,
      metadata: { net, message: msg },
    });
    return NextResponse.json(
      {
        error: translateAuthError(msg, "sign-up"),
        requiresCaptcha: await isCaptchaRequired(failKey),
      },
      { status: net ? 502 : 400 },
    );
  }
}
