/** Сообщения без утечки enumeration (email существует / не существует). */

export const INVALID_CREDENTIALS_MSG = "Неверные учётные данные.";
export const SIGN_UP_GENERIC_MSG =
  "На указанный email отправлено письмо с подтверждением. Проверьте «Входящие» и «Спам», затем перейдите по ссылке.";
export const RESEND_CONFIRMATION_MSG =
  "Если аккаунт ещё не подтверждён, отправлено новое письмо. Проверьте «Входящие» и «Спам», или войдите, если уже регистрировались.";
export const EMAIL_NOT_CONFIRMED_MSG =
  "Email ещё не подтверждён. Откройте ссылку из письма или запросите повторную отправку на странице регистрации.";
export const PASSWORD_RESET_GENERIC_MSG =
  "Если аккаунт с таким email существует, на него отправлено письмо для сброса пароля.";
export const OTP_INVALID_MSG = "Неверный или просроченный код.";
export const PHONE_OTP_SENT_MSG = "Если номер подходит, код отправлен по SMS. Проверьте сообщения.";
export const PHONE_NOT_REGISTERED_MSG =
  "Аккаунт с этим номером не найден. Сначала зарегистрируйтесь через вкладку «Телефон».";
export const PHONE_SMS_NOT_CONFIGURED_MSG =
  "SMS не настроен в Supabase — код на телефон не приходит. " +
  "Пока используйте регистрацию по Email (вкладка «Почта») или Telegram (вкладка «Соцсети»). " +
  "Для SMS: Supabase Dashboard → Authentication → Providers → Phone → Twilio.";
export const CAPTCHA_REQUIRED_MSG = "Подтвердите, что вы не робот (CAPTCHA).";
export const TOO_MANY_ATTEMPTS_MSG = "Слишком много попыток. Подождите и попробуйте снова.";

/** Нормализует ответ Supabase Auth для клиента (без enumeration). */
export function toSafeAuthErrorMessage(message: string, context: "sign-in" | "sign-up" | "otp" | "reset"): string {
  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return context === "otp" ? OTP_INVALID_MSG : INVALID_CREDENTIALS_MSG;
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
    return EMAIL_NOT_CONFIRMED_MSG;
  }
  if (/too many requests|rate/i.test(message)) {
    return TOO_MANY_ATTEMPTS_MSG;
  }
  if (/phone.*invalid|invalid phone/i.test(message)) {
    return "Неверный формат номера. Используйте +79001234567.";
  }
  if (context === "otp") return OTP_INVALID_MSG;
  if (context === "sign-in") return INVALID_CREDENTIALS_MSG;
  if (context === "sign-up") return SIGN_UP_GENERIC_MSG;
  if (context === "reset") return PASSWORD_RESET_GENERIC_MSG;
  return INVALID_CREDENTIALS_MSG;
}
