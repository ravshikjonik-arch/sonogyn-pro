import { NextResponse } from "next/server";

const TRUE = new Set(["true", "1", "yes"]);

/**
 * Mail-first product: registration/login via email + password.
 * SMS / Telegram stay off unless AUTH_ALLOW_PHONE=true.
 * Yandex ID is shown even in mail-first (see login/register socialTab).
 * (Ignores stale AUTH_EMAIL_ONLY=false on older Vercel deploys.)
 */
export function isAuthEmailOnly(): boolean {
  const allowPhone =
    TRUE.has((process.env.AUTH_ALLOW_PHONE ?? "").trim().toLowerCase()) ||
    TRUE.has((process.env.NEXT_PUBLIC_AUTH_ALLOW_PHONE ?? "").trim().toLowerCase());
  return !allowPhone;
}

export const AUTH_METHOD_DISABLED_MSG =
  "Сейчас доступен только вход по email и пароль. Подтвердите почту по ссылке из письма.";

export function disabledAuthMethodResponse(method: "phone" | "google" | "sms" | "telegram") {
  return NextResponse.json(
    { error: AUTH_METHOD_DISABLED_MSG, disabledMethod: method },
    { status: 503 },
  );
}

/** Client-safe (NEXT_PUBLIC_* via next.config env). */
export function isAuthEmailOnlyClient(): boolean {
  const allowPhone = TRUE.has((process.env.NEXT_PUBLIC_AUTH_ALLOW_PHONE ?? "").trim().toLowerCase());
  return !allowPhone;
}
