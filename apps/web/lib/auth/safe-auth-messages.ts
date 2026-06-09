/** Сообщения без утечки enumeration (email существует / не существует). */

export const INVALID_CREDENTIALS_MSG = "Неверные учётные данные.";
export const SIGN_UP_GENERIC_MSG =
  "Если регистрация возможна, на указанный email отправлено письмо с дальнейшими шагами. Проверьте почту или войдите.";
export const PASSWORD_RESET_GENERIC_MSG =
  "Если аккаунт с таким email существует, на него отправлено письмо для сброса пароля.";
export const OTP_INVALID_MSG = "Неверный или просроченный код.";
export const CAPTCHA_REQUIRED_MSG = "Подтвердите, что вы не робот (CAPTCHA).";
export const TOO_MANY_ATTEMPTS_MSG = "Слишком много попыток. Подождите и попробуйте снова.";

/** Нормализует ответ Supabase Auth для клиента (без enumeration). */
export function toSafeAuthErrorMessage(message: string, context: "sign-in" | "sign-up" | "otp" | "reset"): string {
  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return INVALID_CREDENTIALS_MSG;
  }
  if (/user already registered|already been registered|already exists/i.test(message)) {
    return context === "sign-up" ? SIGN_UP_GENERIC_MSG : INVALID_CREDENTIALS_MSG;
  }
  if (/invalid otp|otp_expired|token has expired/i.test(message)) {
    return OTP_INVALID_MSG;
  }
  if (/password should be at least/i.test(message)) {
    return "Пароль слишком короткий. Минимум 6 символов.";
  }
  if (/email not confirmed/i.test(message)) {
    return INVALID_CREDENTIALS_MSG;
  }
  if (/too many requests|rate/i.test(message)) {
    return TOO_MANY_ATTEMPTS_MSG;
  }
  if (/phone.*invalid|invalid phone/i.test(message)) {
    return "Неверный формат номера. Используйте +79001234567.";
  }
  if (context === "sign-in") return INVALID_CREDENTIALS_MSG;
  if (context === "sign-up") return SIGN_UP_GENERIC_MSG;
  if (context === "reset") return PASSWORD_RESET_GENERIC_MSG;
  return INVALID_CREDENTIALS_MSG;
}
