/**
 * Telegram Bot API — серверные уведомления администраторам.
 *
 * ## РФ и VPN
 * Уведомления идут **с сервера Vercel → api.telegram.org** (не с телефона пользователя).
 * VPN на телефоне **не нужен** для admin-алертов.
 * В браузере Telegram Login Widget в РФ может не открываться — используйте вкладки
 * «Почта» / «Телефон» / «Google» на /login и /register.
 *
 * ## Настройка бота (@BotFather)
 * 1. Telegram → @BotFather → `/newbot` → имя и @username.
 * 2. Скопируйте **HTTP API Token** → `TELEGRAM_BOT_TOKEN` на Vercel.
 * 3. Напишите боту любое сообщение (или добавьте в группу и напишите там).
 * 4. Откройте `https://api.telegram.org/bot<TOKEN>/getUpdates` — найдите `"chat":{"id":123456789}`.
 * 5. Несколько админов: `TELEGRAM_ADMIN_IDS=123456789,987654321`
 *
 * @see apps/web/services/TELEGRAM_SETUP.md
 */
import { fetchWithRetry } from "@/lib/http/fetch-with-retry";

export type TelegramAdminEvent =
  | "user.created"
  | "payment.succeeded"
  | "sms.error"
  | "payment.error";

const EVENT_TITLES: Record<TelegramAdminEvent, string> = {
  "user.created": "👤 Новый пользователь",
  "payment.succeeded": "✅ Успешный платёж",
  "sms.error": "⚠️ Ошибка SMS",
  "payment.error": "❌ Ошибка платежа",
};

function readBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

/** Список chat_id админов из TELEGRAM_ADMIN_IDS (через запятую). */
export function readTelegramAdminIds(): string[] {
  const raw =
    process.env.TELEGRAM_ADMIN_IDS?.trim() ||
    process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() ||
    process.env.TELEGRAM_PAYMENTS_CHAT_ID?.trim() ||
    "";

  if (!raw) return [];

  return raw
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function formatAdminMessage(event: TelegramAdminEvent, data: Record<string, unknown>): string {
  const lines = [EVENT_TITLES[event], ""];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;
    lines.push(`${key}: ${String(value)}`);
  }

  lines.push("", `event: ${event}`, `time: ${new Date().toISOString()}`);
  return lines.join("\n");
}

export class TelegramService {
  static isConfigured(): boolean {
    return Boolean(readBotToken()) && readTelegramAdminIds().length > 0;
  }

  /** Отправка сообщения в чат. Не бросает исключения наружу. */
  static async sendMessage(chatId: string, text: string): Promise<boolean> {
    const token = readBotToken();
    if (!token) {
      console.info("[TelegramService] skip sendMessage — TELEGRAM_BOT_TOKEN не задан");
      return false;
    }

    try {
      const res = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4096),
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn("[TelegramService] sendMessage failed", { chatId, status: res.status, body });
        return false;
      }

      return true;
    } catch (err) {
      console.warn("[TelegramService] sendMessage error (Telegram недоступен?)", err);
      return false;
    }
  }

  /** Рассылка всем админам из TELEGRAM_ADMIN_IDS. Fire-and-forget. */
  static async notifyAdmins(event: TelegramAdminEvent, data: Record<string, unknown>): Promise<void> {
    const adminIds = readTelegramAdminIds();
    if (!readBotToken()) {
      console.info("[TelegramService] skip notifyAdmins — TELEGRAM_BOT_TOKEN не задан", event);
      return;
    }
    if (adminIds.length === 0) {
      console.info("[TelegramService] skip notifyAdmins — TELEGRAM_ADMIN_IDS пуст", event);
      return;
    }

    const text = formatAdminMessage(event, data);
    await Promise.all(adminIds.map((chatId) => TelegramService.sendMessage(chatId, text)));
  }

  /** Не блокирует ответ API при недоступности Telegram. */
  static notifyAdminsSafe(event: TelegramAdminEvent, data: Record<string, unknown>): void {
    void TelegramService.notifyAdmins(event, data).catch((err) => {
      console.warn("[TelegramService] notifyAdminsSafe", event, err);
    });
  }
}
