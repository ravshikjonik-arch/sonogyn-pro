/** Пилот: email + пароль — основной канал; Telegram/SMS/Yandex оставляем как дополнительные. */

export function isPilotTelegramPrimary(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_PILOT_TELEGRAM_PRIMARY?.trim().toLowerCase();
  if (!raw) return false;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return raw === "true" || raw === "1" || raw === "yes";
}

/** Закрытый пилот до 10 врачей — только Telegram, без SMS/email на входе. */
export function isPilotClosedAccessClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_PILOT_CLOSED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return raw === "true" || raw === "1" || raw === "yes";
}

export const PILOT_AUTH_SUBTITLE = isPilotClosedAccessClient()
  ? "Закрытый пилот для врачей. Вход одной кнопкой через Telegram — ID вводить не нужно."
  : "Основной способ входа для пилота — email и пароль. SMS, Яндекс ID и Telegram доступны как дополнительные каналы.";

export const PILOT_REGISTER_SUBTITLE =
  "Заполните данные врача и создайте пароль. После регистрации вы сможете войти по email.";

export const PILOT_TELEGRAM_TAB_BADGE = isPilotClosedAccessClient() ? "Пилот" : "Рекомендуем";
