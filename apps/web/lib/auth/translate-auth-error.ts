import { explainAuthNetworkFailure } from "@/lib/auth-network-error";

/** Локализация типичных ошибок Supabase Auth для UI */
export function translateAuthError(message: string): string {
  const base = explainAuthNetworkFailure(message);

  if (/invalid login credentials/i.test(message)) {
    return "Неверный email или пароль.";
  }
  if (/user already registered/i.test(message)) {
    return "Пользователь с таким email уже зарегистрирован. Войдите или восстановите пароль.";
  }
  if (/password should be at least/i.test(message)) {
    return "Пароль слишком короткий. Минимум 6 символов.";
  }
  if (/invalid otp|otp_expired|token has expired/i.test(message)) {
    return "Неверный или просроченный код. Запросите SMS повторно.";
  }
  if (/phone.*invalid|invalid phone/i.test(message)) {
    return "Неверный формат номера. Используйте формат +79001234567.";
  }
  if (/sms.*rate|too many requests/i.test(message)) {
    return "Слишком много попыток. Подождите и запросите код снова.";
  }
  if (/oauth|provider.*not enabled/i.test(message)) {
    return "Провайдер входа не включён в Supabase Dashboard → Authentication → Providers.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Email не подтверждён. Проверьте почту или отключите Confirm email в Supabase для dev.";
  }

  return base;
}

export function requireOnlineForAuth(): string | null {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "Требуется интернет для входа.";
  }
  return null;
}
