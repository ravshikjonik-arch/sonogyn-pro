/**
 * Client-safe Telegram bot display helpers.
 * SECURITY: only NEXT_PUBLIC_* — never import TELEGRAM_BOT_TOKEN here.
 */

/** Username бота для Login Widget / UI (без @). */
export function readTelegramBotUsername(): string {
  const fromPublic = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  return (fromPublic ?? "").replace(/^@/, "");
}
