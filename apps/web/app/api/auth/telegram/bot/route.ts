import { NextResponse } from "next/server";

import { rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  ensureTelegramUser,
  establishTelegramSession,
  readInternalAuthSecret,
  type TelegramPayload,
} from "@/lib/auth/telegram-supabase";

/** Доверенный вход через Telegram-бота (без Login Widget hash). Только server-to-server. */
export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "auth-telegram-bot", RL.authTelegramBot);
  if (limited) return limited;

  if (!readInternalAuthSecret(request)) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  let body: TelegramPayload;
  try {
    body = (await request.json()) as TelegramPayload;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const telegramId = String(body.id ?? "").trim();
  if (!telegramId) {
    return NextResponse.json({ error: "Не указан Telegram ID." }, { status: 400 });
  }

  try {
    const email = await ensureTelegramUser({ ...body, source: "bot" });
    return establishTelegramSession(email, request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: translateAuthError(msg) }, { status: 500 });
  }
}
