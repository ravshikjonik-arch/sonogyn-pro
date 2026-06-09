import { explainAuthNetworkFailure } from "@/lib/auth-network-error";

import {
  INVALID_CREDENTIALS_MSG,
  OTP_INVALID_MSG,
  PASSWORD_RESET_GENERIC_MSG,
  SIGN_UP_GENERIC_MSG,
  TOO_MANY_ATTEMPTS_MSG,
  toSafeAuthErrorMessage,
} from "./safe-auth-messages";

/** Локализация ошибок Supabase Auth для UI (без enumeration). */
export function translateAuthError(message: string, context: "sign-in" | "sign-up" | "otp" | "reset" = "sign-in"): string {
  if (/failed to fetch|fetch failed|network/i.test(message)) {
    return explainAuthNetworkFailure(message);
  }
  if (/email signups are disabled/i.test(message)) {
    return explainAuthNetworkFailure(message);
  }
  if (/oauth|provider.*not enabled/i.test(message)) {
    return "Провайдер входа не включён в Supabase Dashboard → Authentication → Providers.";
  }
  return toSafeAuthErrorMessage(message, context);
}

export function translateSignInError(message: string): string {
  return translateAuthError(message, "sign-in");
}

export function translateSignUpError(message: string): string {
  return translateAuthError(message, "sign-up");
}

export function translateOtpError(message: string): string {
  if (/invalid otp|otp_expired|token has expired/i.test(message)) return OTP_INVALID_MSG;
  if (/too many requests|rate/i.test(message)) return TOO_MANY_ATTEMPTS_MSG;
  return OTP_INVALID_MSG;
}

export function translateResetPasswordSuccess(): string {
  return PASSWORD_RESET_GENERIC_MSG;
}

export function translateSignUpSuccess(): string {
  return SIGN_UP_GENERIC_MSG;
}

export { INVALID_CREDENTIALS_MSG, PASSWORD_RESET_GENERIC_MSG, SIGN_UP_GENERIC_MSG };

export function requireOnlineForAuth(): string | null {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "Требуется интернет для входа.";
  }
  return null;
}
