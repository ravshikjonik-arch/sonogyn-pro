import { NextResponse } from "next/server";

import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  ensureTelegramUser,
  establishTelegramSession,
  verifyTelegramWidgetHash,
  type TelegramPayload,
} from "@/lib/auth/telegram-supabase";

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN не задан на сервере." }, { status: 503 });
  }

  let body: TelegramPayload;
  try {
    body = (await request.json()) as TelegramPayload;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const telegramId = String(body.id ?? "").trim();
  if (!telegramId || !verifyTelegramWidgetHash(body, botToken)) {
    return NextResponse.json({ error: "Неверная подпись Telegram." }, { status: 401 });
  }

  const authDate = Number(body.auth_date ?? 0);
  if (authDate && Date.now() / 1000 - authDate > 86_400) {
    return NextResponse.json({ error: "Сессия Telegram устарела. Повторите вход." }, { status: 401 });
  }

  try {
    const email = await ensureTelegramUser({ ...body, source: "widget" });
    return establishTelegramSession(email, request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: translateAuthError(msg) }, { status: 500 });
  }
}
