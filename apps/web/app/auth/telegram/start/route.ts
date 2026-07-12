import { NextResponse } from "next/server";

import { safeInternalPath } from "@/lib/nav/safe-redirect";

export const runtime = "nodejs";

/** Старый полноэкранный Telegram OAuth больше не используем: oauth.telegram.org/auth отдаёт deprecated. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeInternalPath(url.searchParams.get("next"), "/app");
  const isRegister = url.searchParams.get("register") === "1";
  const origin = url.origin;
  const fail = new URL(isRegister ? "/register" : "/login", origin);
  fail.searchParams.set("method", "telegram");
  if (!isRegister) fail.searchParams.set("redirectedFrom", next);
  fail.searchParams.set(
    "telegram_message",
    "Прямая кнопка Telegram OAuth больше не используется: Telegram возвращает deprecated. Используйте вход по коду через бота.",
  );
  return NextResponse.redirect(fail);
}
