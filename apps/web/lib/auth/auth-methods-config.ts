import { NextResponse } from "next/server";

const FALSE = new Set(["false", "0", "no"]);

function parseEmailOnly(raw: string | undefined): boolean | undefined {
  if (!raw?.trim()) return undefined;
  return !FALSE.has(raw.trim().toLowerCase());
}

/** Email-only auth (Google / SMS отключены). По умолчанию false — все способы включены. */
export function isAuthEmailOnly(): boolean {
  return (
    parseEmailOnly(process.env.AUTH_EMAIL_ONLY) ??
    parseEmailOnly(process.env.NEXT_PUBLIC_AUTH_EMAIL_ONLY) ??
    false
  );
}

export const AUTH_METHOD_DISABLED_MSG =
  "Сейчас доступен только вход по email и пароль. Подтвердите почту по ссылке из письма.";

export function disabledAuthMethodResponse(method: "phone" | "google" | "sms" | "telegram") {
  return NextResponse.json(
    { error: AUTH_METHOD_DISABLED_MSG, disabledMethod: method },
    { status: 503 },
  );
}

/** Client-safe (NEXT_PUBLIC_AUTH_EMAIL_ONLY через next.config env). */
export function isAuthEmailOnlyClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_EMAIL_ONLY?.trim().toLowerCase();
  if (!raw) return false;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true;
}
