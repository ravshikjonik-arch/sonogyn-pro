/**
 * Раньше список Telegram ID закрывал вход десятью врачами.
 * Для открытой регистрации врачей список не действует, даже если переменная ещё задана.
 */

export const PILOT_ALLOWLIST_MAX = 10;

export const PILOT_ACCESS_DENIED_MSG =
  "Не удалось подтвердить Telegram. Войдите по email или повторите попытку.";

export const PILOT_REGISTER_FIRST_MSG =
  "Аккаунт не найден. Сначала пройдите регистрацию — заполните данные врача и подтвердите через Telegram.";

/** Список Telegram ID из AUTH_PILOT_TELEGRAM_ALLOWLIST (через запятую). */
export function readPilotAllowlist(): string[] {
  const raw = process.env.AUTH_PILOT_TELEGRAM_ALLOWLIST?.trim();
  if (!raw) return [];
  const ids = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((id) => /^\d{5,20}$/.test(id));
  return [...new Set(ids)].slice(0, PILOT_ALLOWLIST_MAX);
}

export function isPilotAllowlistEnabled(): boolean {
  return false;
}

export function isTelegramIdAllowlisted(telegramId: string): boolean {
  const id = telegramId.trim();
  if (!id) return false;
  if (!isPilotAllowlistEnabled()) return true;
  return readPilotAllowlist().includes(id);
}

/** null = разрешено; иначе текст ошибки для пользователя. */
export function checkPilotTelegramAllowed(telegramId: string): string | null {
  if (!isPilotAllowlistEnabled()) return null;
  if (isTelegramIdAllowlisted(telegramId)) return null;
  return PILOT_ACCESS_DENIED_MSG;
}
