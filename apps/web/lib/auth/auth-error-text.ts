/** Собирает текст Supabase AuthError для маппинга (message + code + status). */
export function formatSupabaseAuthError(error: {
  message?: string;
  code?: string;
  status?: number | string;
}): string {
  return [error.message, error.code, error.status != null ? String(error.status) : ""]
    .filter(Boolean)
    .join(" ");
}

/** Пользователь ввёл телефон в поле email. */
export function looksLikePhoneInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return false;
  return (
    trimmed.startsWith("+") ||
    digits.startsWith("7") ||
    digits.startsWith("8") ||
    /^[\d\s()+ -]+$/.test(trimmed)
  );
}

export const USE_PHONE_TAB_MSG =
  "Похоже, вы ввели номер телефона. Перейдите на вкладку «Телефон» — там вход и регистрация по SMS.";
