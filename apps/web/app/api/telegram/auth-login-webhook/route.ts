import { NextResponse } from "next/server";

import { handleTelegramMobileLoginMessage } from "@/lib/auth/handle-telegram-mobile-login-message";
import { timingSafeEqual } from "@/lib/security/timing-safe";

export const runtime = "nodejs";
export const maxDuration = 30;

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

/** Telegram Bot API webhook: /start login_{uuid} для mobile deep-link входа. */
export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let update: { message?: Parameters<typeof handleTelegramMobileLoginMessage>[0] };
  try {
    update = (await request.json()) as { message?: Parameters<typeof handleTelegramMobileLoginMessage>[0] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (update.message) {
    await handleTelegramMobileLoginMessage(update.message);
  }
  return NextResponse.json({ ok: true });
}