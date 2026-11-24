import { confirmTelegramMobileLoginPending } from "@/lib/auth/telegram-mobile-login-pending";
import { readTelegramBotToken } from "@/lib/auth/telegram-bot-config";

const MOBILE_SCHEME = "com.yakrav7700.usriskcalc";

type TelegramFrom = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramLoginMessage = {
  chat?: { id?: number | string };
  from?: TelegramFrom;
  text?: string;
};

async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
  const token = readTelegramBotToken();
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4096),
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  }).catch(() => {});
}

/**
 * /start login_{uuid} от основного бота (mobile deep-link вход).
 * @returns true если сообщение обработано (в т.ч. обычный /start без login_)
 */
export async function handleTelegramMobileLoginMessage(message: TelegramLoginMessage): Promise<boolean> {
  if (!message.text || message.from?.id == null || message.chat?.id == null) {
    return false;
  }

  const match = message.text.match(/^\/start(?:@\w+)?\s+login_([0-9a-f-]{36})$/i);
  if (!match) {
    if (message.text.startsWith("/start")) {
      await sendTelegramMessage(
        message.chat.id,
        "SonoGyn Pro: откройте вход через приложение → «Войти через Telegram».",
      );
      return true;
    }
    return false;
  }

  const nonce = match[1]!;
  const from = message.from;
  const ok = await confirmTelegramMobileLoginPending(nonce, {
    id: from.id,
    first_name: from.first_name,
    last_name: from.last_name,
    username: from.username,
    source: "bot",
  });

  if (!ok) {
    await sendTelegramMessage(
      message.chat.id,
      "Сессия истекла. Запросите вход в приложении заново.",
    );
    return true;
  }

  const deepLink = `${MOBILE_SCHEME}://auth/callback?telegram_nonce=${nonce}`;
  await sendTelegramMessage(
    message.chat.id,
    `✅ Подтверждено.\n\nОткройте SonoGyn Pro:\n${deepLink}\n\nЕсли ссылка не открывается — вернитесь в приложение, вход завершится автоматически.`,
  );
  return true;
}