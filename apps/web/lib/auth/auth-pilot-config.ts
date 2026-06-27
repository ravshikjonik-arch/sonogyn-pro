/** Пилот: Telegram — основной канал входа; SMS дублирует код на +7. */

export function isPilotTelegramPrimary(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_PILOT_TELEGRAM_PRIMARY?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true;
}

/** Закрытый пилот до 10 врачей — только Telegram, без SMS/email на входе. */
export function isPilotClosedAccessClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_PILOT_CLOSED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return raw === "true" || raw === "1" || raw === "yes";
}

export const PILOT_AUTH_SUBTITLE = isPilotClosedAccessClient()
  ? "Закрытый пилот для врачей. Вход одной кнопкой через Telegram — ID вводить не нужно."
  : "Telegram — основной способ входа. SMS на +7 дублирует код за секунды.";

export const PILOT_REGISTER_SUBTITLE =
  "Заполните данные врача и подтвердите через Telegram. Ник @username вводить не нужно.";

export const PILOT_TELEGRAM_TAB_BADGE = isPilotClosedAccessClient() ? "Пилот" : "Рекомендуем";
