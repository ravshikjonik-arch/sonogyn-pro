import { NextResponse } from "next/server";

import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  ensureTelegramUser,
  establishTelegramSession,
  PilotTelegramAuthError,
  verifyTelegramWidgetHash,
  type TelegramPayload,
} from "@/lib/auth/telegram-supabase";
import {
  PILOT_REGISTER_INTENT_COOKIE,
  readRegisterIntentCookie,
} from "@/lib/auth/pilot-register-intent";
import { safeInternalPath } from "@/lib/nav/safe-redirect";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function authFailRedirect(req: Request, code: string, message?: string, method = "telegram") {
  const url = new URL("/login", req.url);
  url.searchParams.set("method", method);
  url.searchParams.set("telegram_error", code);
  if (message) url.searchParams.set("telegram_message", message.slice(0, 200));
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
    const jar = await cookies();
    const registration = readRegisterIntentCookie(jar.get(PILOT_REGISTER_INTENT_COOKIE)?.value);

    const email = await ensureTelegramUser(body, { registration: registration ?? undefined });
    const sessionResponse = await establishTelegramSession(email, req);
    if (!sessionResponse.ok) {
      const payload = (await sessionResponse.json().catch(() => null)) as { error?: string } | null;
      return authFailRedirect(req, "session", payload?.error);
    }

    const redirect = NextResponse.redirect(new URL(next, req.url));
    if (registration) {
      redirect.cookies.set(PILOT_REGISTER_INTENT_COOKIE, "", { path: "/", maxAge: 0 });
    }
    sessionResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  } catch (e) {
    if (e instanceof PilotTelegramAuthError) {
      if (e.code === "needs_registration") {
        const regUrl = new URL("/register", req.url);
        regUrl.searchParams.set("method", "telegram");
        regUrl.searchParams.set("message", "register_first");
        return NextResponse.redirect(regUrl);
      }
      return authFailRedirect(req, "denied", e.message);
    }
    const msg = e instanceof Error ? e.message : String(e);
    return authFailRedirect(req, "failed", translateAuthError(msg));
  }
}
