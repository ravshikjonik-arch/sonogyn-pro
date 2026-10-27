/** Пилот: email + пароль — основной канал; Telegram/SMS/Yandex оставляем как дополнительные. */

export function isPilotTelegramPrimary(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_PILOT_TELEGRAM_PRIMARY?.trim().toLowerCase();
  if (!raw) return false;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return raw === "true" || raw === "1" || raw === "yes";
}

/** Закрытый список из 10 врачей снят. Флаг окружения больше не включает его. */
export function isPilotClosedAccessClient(): boolean {
  return false;
}

export const PILOT_AUTH_SUBTITLE =
  "Вход по email и паролю. SMS, Яндекс ID и Telegram доступны как дополнительные каналы.";

export const PILOT_REGISTER_SUBTITLE =
  "Заполните данные врача и создайте пароль. После регистрации вы сможете войти по email.";

export const PILOT_TELEGRAM_TAB_BADGE = isPilotClosedAccessClient() ? "Пилот" : "Рекомендуем";
