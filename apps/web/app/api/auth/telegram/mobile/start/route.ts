import { NextResponse } from "next/server";

import { createTelegramMobileLoginPending } from "@/lib/auth/telegram-mobile-login-pending";
import { readTelegramBotUsername } from "@/lib/auth/telegram-bot-config";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";

/** POST — создать nonce для входа через Telegram бота (mobile). */
export async function POST(request: Request) {
  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(request, "auth-telegram-mobile-start"),
    RL.authTelegram.limit,
    RL.authTelegram.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const username = readTelegramBotUsername();
  if (!username) {
    return NextResponse.json({ error: "Telegram bot не настроен на сервере." }, { status: 503 });
  }

  try {
    const result = await createTelegramMobileLoginPending(username);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}