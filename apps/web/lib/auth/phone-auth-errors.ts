import {
  INVALID_CREDENTIALS_MSG,
  OTP_INVALID_MSG,
  PHONE_NOT_REGISTERED_MSG,
  TOO_MANY_ATTEMPTS_MSG,
} from "./safe-auth-messages";

/** Локализация ошибок phone OTP (send + verify). */
export function translatePhoneAuthError(message: string, mode: "login" | "register" = "login"): string {
  if (/phone_provider_disabled|unsupported phone provider/i.test(message)) {
    return (
      "Вход по SMS не настроен в Supabase. Dashboard → Authentication → Providers → Phone: " +
      "включите провайдер и подключите SMS (Twilio / MessageBird и т.п.)."
    );
  }

  if (/signups not allowed|signup.*disabled|user not found|no user|user does not exist/i.test(message)) {
    return mode === "register"
      ? "Регистрация по SMS отключена в Supabase. Включите Phone provider и sign ups."
      : PHONE_NOT_REGISTERED_MSG;
  }

  if (/invalid otp|otp_expired|token has expired|expired.*invalid|invalid.*token/i.test(message)) {
    return OTP_INVALID_MSG;
  }

  if (/invalid login credentials|invalid credentials/i.test(message)) {
    // Supabase часто отдаёт это при неверном SMS-коде, а не при «пароле».
    return OTP_INVALID_MSG;
  }

  if (/phone.*invalid|invalid phone|unable to parse/i.test(message)) {
    return "Неверный формат номера. Используйте +79001234567.";
  }

  if (/too many requests|rate/i.test(message)) {
    return TOO_MANY_ATTEMPTS_MSG;
  }

  if (/user already registered|already been registered|already exists/i.test(message)) {
    return mode === "register"
      ? "Этот номер уже зарегистрирован. Войдите через вкладку «Телефон» на странице входа."
      : INVALID_CREDENTIALS_MSG;
  }

  return mode === "register"
    ? "Не удалось отправить SMS. Проверьте номер и настройки Phone в Supabase."
    : OTP_INVALID_MSG;
}

export function phoneAuthNeedsRegistration(message: string): boolean {
  return /signups not allowed|signup.*disabled|user not found|no user|user does not exist/i.test(message);
}
