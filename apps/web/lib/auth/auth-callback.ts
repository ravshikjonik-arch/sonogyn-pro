import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

import { safeInternalPath } from "@/lib/nav/safe-redirect";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export type AuthCallbackParams = {
  code: string | null;
  tokenHash: string | null;
  type: EmailOtpType | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  next: string;
};

export function parseAuthCallbackParams(url: URL, defaultNext = "/app"): AuthCallbackParams {
  const rawType = url.searchParams.get("type")?.trim() ?? null;
  const type = rawType && OTP_TYPES.has(rawType) ? (rawType as EmailOtpType) : null;

  return {
    code: url.searchParams.get("code")?.trim() || null,
    tokenHash:
      url.searchParams.get("token_hash")?.trim() ||
      url.searchParams.get("token")?.trim() ||
      null,
    type,
    error: url.searchParams.get("error")?.trim() || null,
    errorCode: url.searchParams.get("error_code")?.trim() || null,
    errorDescription: url.searchParams.get("error_description")?.trim() || null,
    next: safeInternalPath(url.searchParams.get("next"), defaultNext),
  };
}

export function recoveryResetPath(): string {
  return "/auth/reset-password?recovery=1";
}

export type AuthCallbackResult =
  | { ok: true; recovery: boolean }
  | { ok: false; message: string; errorCode?: string | null };

/** PKCE code exchange or OTP verify (recovery works cross-browser via token_hash). */
export async function completeAuthCallback(
  supabase: SupabaseClient,
  params: AuthCallbackParams,
): Promise<AuthCallbackResult> {
  if (params.error || params.errorCode) {
    return {
      ok: false,
      message: humanizeAuthCallbackError(params),
      errorCode: params.errorCode,
    };
  }

  if (params.tokenHash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: params.type,
    });
    if (error) {
      return { ok: false, message: error.message, errorCode: "verify_otp_failed" };
    }
    return { ok: true, recovery: params.type === "recovery" };
  }

  if (params.tokenHash) {
    const otpType: EmailOtpType = params.next.includes("reset-password") ? "recovery" : "magiclink";
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: otpType,
    });
    if (error) {
      return { ok: false, message: error.message, errorCode: "verify_otp_failed" };
    }
    return { ok: true, recovery: otpType === "recovery" };
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      const pkceHint =
        /code verifier|both auth code and code verifier/i.test(error.message)
          ? " Откройте ссылку в том же браузере, где запрашивали сброс, или обновите шаблон письма Supabase (TokenHash → /auth/callback)."
          : "";
      return {
        ok: false,
        message: `${error.message}${pkceHint}`,
        errorCode: "exchange_code_failed",
      };
    }
    return { ok: true, recovery: params.type === "recovery" || params.next.includes("reset-password") };
  }

  return {
    ok: false,
    message: "В ссылке нет кода подтверждения. Запросите новое письмо.",
    errorCode: "missing_auth_params",
  };
}

function humanizeAuthCallbackError(params: AuthCallbackParams): string {
  if (params.errorCode === "otp_expired") {
    return "Ссылка из письма устарела или уже использована. Запросите восстановление пароля ещё раз.";
  }
  if (params.errorCode === "access_denied") {
    return params.errorDescription ?? "Доступ по ссылке отклонён. Запросите новое письмо.";
  }
  return params.errorDescription ?? params.error ?? "Не удалось подтвердить ссылку из письма.";
}
