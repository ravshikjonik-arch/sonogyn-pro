import {
  OTP_INVALID_MSG,
  PHONE_NOT_REGISTERED_MSG,
  PHONE_SMS_NOT_CONFIGURED_MSG,
  TOO_MANY_ATTEMPTS_MSG,
} from "./safe-auth-messages";

export type PhoneAuthErrorResult = {
  message: string;
  needsRegistration?: boolean;
  smsNotConfigured?: boolean;
};

function isSmsProviderError(raw: string): boolean {
  return /phone_provider_disabled|unsupported phone provider|sms_send_failed|sms.*not configured|error sending.*sms|error sending.*otp|twilio|vonage|messagebird|provider.*not configured|422|sms.*provider/i.test(
    raw,
  );
}

function isSignupBlocked(raw: string): boolean {
  return /signups not allowed|signup.*disabled|phone signups are disabled|new users.*disabled|user not found|no user|user does not exist/i.test(
    raw,
  );
}

/** Локализация ошибок phone OTP (send + verify). Никогда не «Неверные учётные данные». */
export function translatePhoneAuthError(
  message: string,
  mode: "login" | "register" = "login",
): PhoneAuthErrorResult {
  const raw = message.trim();

  if (isSmsProviderError(raw)) {
    return { message: PHONE_SMS_NOT_CONFIGURED_MSG, smsNotConfigured: true };
  }

  if (isSignupBlocked(raw)) {
    return {
      message:
        mode === "register"
          ? "Регистрация по SMS отключена в Supabase (Authentication → Providers → Phone → Enable sign ups)."
          : PHONE_NOT_REGISTERED_MSG,
      needsRegistration: mode === "login",
    };
  }

  if (/invalid otp|otp_expired|token has expired|expired.*invalid|invalid.*token|verification.*failed|invalid verification/i.test(raw)) {
    return { message: OTP_INVALID_MSG };
  }

  if (/invalid login credentials|invalid credentials/i.test(raw)) {
    return { message: OTP_INVALID_MSG };
  }

  if (/phone.*invalid|invalid phone|unable to parse|e\.164/i.test(raw)) {
    return { message: "Неверный формат номера. Используйте +79001234567." };
  }

  if (/too many requests|rate|over_sms_send_rate_limit|over_request_rate_limit/i.test(raw)) {
    return { message: TOO_MANY_ATTEMPTS_MSG };
  }

  if (/user already registered|already been registered|already exists|phone number already/i.test(raw)) {
    return {
      message:
        mode === "register"
          ? "Этот номер уже зарегистрирован. Войдите: вкладка «Телефон» на странице входа."
          : "Этот номер уже зарегистрирован. Войдите через вкладку «Телефон».",
    };
  }

  if (mode === "register") {
    return {
      message: PHONE_SMS_NOT_CONFIGURED_MSG,
      smsNotConfigured: true,
    };
  }

  return { message: OTP_INVALID_MSG };
}

export function phoneAuthNeedsRegistration(message: string): boolean {
  return isSignupBlocked(message);
}

export function phoneAuthSmsNotConfigured(message: string): boolean {
  return isSmsProviderError(message);
}
