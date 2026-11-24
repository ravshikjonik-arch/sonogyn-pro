import { NextResponse } from "next/server";

import { confirmTelegramMobileLoginPending } from "@/lib/auth/telegram-mobile-login-pending";
import { readTelegramBotToken } from "@/lib/auth/telegram-bot-config";
import { timingSafeEqual } from "@/lib/security/timing-safe";

export const runtime = "nodejs";
export const maxDuration = 30;

const MOBILE_SCHEME = "com.yakrav7700.usriskcalc";

type TelegramFrom = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramMessage = {
  chat?: { id?: number };
  from?: TelegramFrom;
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

function readWebhookSecret(): string | null {
  return (
    process.env.TELEGRAM_LOGIN_WEBHOOK_SECRET?.trim() ||
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ||
    null
  );
}

function isWebhookAuthorized(request: Request): boolean {
  const secret = readWebhookSecret();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("x-telegram-bot-api-secret-token")?.trim() ?? "";
  return timingSafeEqual(secret, header);
}

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

/** Telegram Bot API webhook: /start login_{uuid} для mobile deep-link входа. */
export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = update.message;
  if (!message?.text || !message.from?.id || message.chat?.id == null) {
    return NextResponse.json({ ok: true });
  }

  const match = message.text.match(/^\/start(?:@\w+)?\s+login_([0-9a-f-]{36})$/i);
  if (!match) {
    if (message.text.startsWith("/start")) {
      await sendTelegramMessage(
        message.chat.id,
        "SonoGyn Pro: откройте вход через приложение → «Войти через Telegram».",
      );
    }
    return NextResponse.json({ ok: true });
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
    return NextResponse.json({ ok: true });
  }

  const deepLink = `${MOBILE_SCHEME}://auth/callback?telegram_nonce=${nonce}`;
  await sendTelegramMessage(
    message.chat.id,
    `✅ Подтверждено.\n\nОткройте SonoGyn Pro:\n${deepLink}\n\nЕсли ссылка не открывается — вернитесь в приложение, вход завершится автоматически.`,
  );

  return NextResponse.json({ ok: true });
}