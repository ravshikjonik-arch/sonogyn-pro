import { NextResponse } from "next/server";

import {
  buildTelegramOAuthUrl,
  readTelegramBotToken,
  readTelegramBotUsername,
  resolveTelegramBotId,
} from "@/lib/auth/telegram-bot-config";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

export const runtime = "nodejs";

/** Полноэкранный вход Telegram (fallback, если iframe Login Widget неактивен). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeInternalPath(url.searchParams.get("next"), "/app");
  const origin = url.origin;

  if (!readTelegramBotToken()) {
    const fail = new URL("/login", origin);
    fail.searchParams.set("method", "social");
    fail.searchParams.set("telegram_error", "token");
    return NextResponse.redirect(fail);
  }

  const botId = await resolveTelegramBotId();
  if (!botId) {
    const fail = new URL("/login", origin);
    fail.searchParams.set("method", "social");
    fail.searchParams.set("telegram_error", "failed");
    fail.searchParams.set("telegram_message", "Не удалось получить bot_id. Проверьте TELEGRAM_BOT_TOKEN.");
    return NextResponse.redirect(fail);
  }

  const returnTo = `${origin}/auth/telegram/callback?next=${encodeURIComponent(next)}`;
  const tgUrl = buildTelegramOAuthUrl({ origin, returnTo, botId });

  return NextResponse.redirect(tgUrl);
}
