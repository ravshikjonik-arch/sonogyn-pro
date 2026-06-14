import { NextResponse } from "next/server";

import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  ensureTelegramUser,
  establishTelegramSession,
  verifyTelegramWidgetHash,
  type TelegramPayload,
} from "@/lib/auth/telegram-supabase";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

export const runtime = "nodejs";

function authFailRedirect(req: Request, code: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("method", "social");
  url.searchParams.set("telegram_error", code);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return authFailRedirect(req, "token");
  }

  const url = new URL(req.url);
  const body: TelegramPayload = {
    id: url.searchParams.get("id") ?? undefined,
    first_name: url.searchParams.get("first_name") ?? undefined,
    last_name: url.searchParams.get("last_name") ?? undefined,
    username: url.searchParams.get("username") ?? undefined,
    photo_url: url.searchParams.get("photo_url") ?? undefined,
    auth_date: url.searchParams.get("auth_date") ?? undefined,
    hash: url.searchParams.get("hash") ?? undefined,
    source: "widget-redirect",
  };

  const next = safeInternalPath(url.searchParams.get("next"), "/app");

  if (!verifyTelegramWidgetHash(body, botToken)) {
    return authFailRedirect(req, "hash");
  }

  const authDate = Number(body.auth_date ?? 0);
  if (authDate && Date.now() / 1000 - authDate > 86_400) {
    return authFailRedirect(req, "expired");
  }

  try {
    const email = await ensureTelegramUser(body);
    const sessionResponse = await establishTelegramSession(email, req);
    if (!sessionResponse.ok) {
      const payload = (await sessionResponse.json().catch(() => null)) as { error?: string } | null;
      const fail = authFailRedirect(req, "session");
      if (payload?.error) fail.searchParams.set("telegram_message", payload.error.slice(0, 120));
      return fail;
    }

    const redirect = NextResponse.redirect(new URL(next, req.url));
    sessionResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const fail = authFailRedirect(req, "failed");
    fail.searchParams.set("telegram_message", translateAuthError(msg).slice(0, 120));
    return fail;
  }
}
