/** Пилот: Telegram — основной канал входа; SMS дублирует код на +7. */

export function isPilotTelegramPrimary(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_PILOT_TELEGRAM_PRIMARY?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true;
}

export const PILOT_AUTH_SUBTITLE =
  "Telegram — основной способ входа. SMS на +7 дублирует код за секунды.";

export const PILOT_TELEGRAM_TAB_BADGE = "Рекомендуем";
