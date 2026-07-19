import { NextResponse } from "next/server";

import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  ensureTelegramUser,
  establishTelegramSession,
  PilotTelegramAuthError,
  verifyTelegramWidgetHash,
} from "@/lib/auth/telegram-supabase";
import {
  extractTelegramPayloadFromUrl,
  telegramAuthErrorMessage,
} from "@/lib/auth/telegram-widget";
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
  const text = telegramAuthErrorMessage(code, message);
  if (text) url.searchParams.set("telegram_message", text.slice(0, 200));
  return NextResponse.redirect(url);
}

function registerFailRedirect(req: Request, code: string, message?: string) {
  const url = new URL("/register", req.url);
  url.searchParams.set("method", "telegram");
  url.searchParams.set("telegram_error", code);
  const text = telegramAuthErrorMessage(code, message);
  if (text) url.searchParams.set("telegram_message", text.slice(0, 200));
  if (code === "register_expired" || code === "needs_registration") {
    url.searchParams.set("message", "register_first");
  }
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return authFailRedirect(req, "token");
  }

  const url = new URL(req.url);
  const isRegister = url.searchParams.get("register") === "1";
  const body = extractTelegramPayloadFromUrl(url);
  const next = safeInternalPath(url.searchParams.get("next"), "/app");

  if (!verifyTelegramWidgetHash(body, botToken)) {
    return isRegister ? registerFailRedirect(req, "hash") : authFailRedirect(req, "hash");
  }

  const authDate = Number(body.auth_date ?? 0);
  if (authDate && Date.now() / 1000 - authDate > 86_400) {
    return isRegister ? registerFailRedirect(req, "expired") : authFailRedirect(req, "expired");
  }

  try {
    const jar = await cookies();
    const registration = readRegisterIntentCookie(jar.get(PILOT_REGISTER_INTENT_COOKIE)?.value);

    if (isRegister && !registration?.full_name?.trim()) {
      return registerFailRedirect(req, "register_expired");
    }

    const email = await ensureTelegramUser(
      { ...body, source: isRegister ? "widget-register" : "widget-redirect" },
      { registration: registration ?? undefined },
    );
    const sessionResponse = await establishTelegramSession(email, req);
    if (!sessionResponse.ok) {
      const payload = (await sessionResponse.json().catch(() => null)) as { error?: string } | null;
      return isRegister
        ? registerFailRedirect(req, "session", payload?.error)
        : authFailRedirect(req, "session", payload?.error);
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
        return registerFailRedirect(req, "needs_registration", e.message);
      }
      return authFailRedirect(req, "denied", e.message);
    }
    const msg = e instanceof Error ? e.message : String(e);
    return isRegister
      ? registerFailRedirect(req, "failed", translateAuthError(msg))
      : authFailRedirect(req, "failed", translateAuthError(msg));
  }
}
