import { NextResponse } from "next/server";

const TRUE = new Set(["true", "1", "yes"]);
const FALSE = new Set(["false", "0", "no"]);

function envFlag(raw: string | undefined): "true" | "false" | "unset" {
  const v = (raw ?? "").trim().toLowerCase();
  if (TRUE.has(v)) return "true";
  if (FALSE.has(v)) return "false";
  return "unset";
}

/** SMS.ru / Twilio credentials present → phone OTP can work. */
export function hasSmsProviderCredentials(): boolean {
  return Boolean(process.env.SMSRU_API_ID?.trim() || process.env.TWILIO_ACCOUNT_SID?.trim());
}

/**
 * Email + password всегда основной канал.
 * SMS выключен только если явно AUTH_ALLOW_PHONE=false.
 * Иначе: AUTH_ALLOW_PHONE=true ИЛИ есть SMSRU/Twilio → телефон разрешён.
 *
 * Важно: не доверяем запечённому NEXT_PUBLIC_AUTH_ALLOW_PHONE=false сильнее,
 * чем runtime SMSRU_API_ID — иначе прод с smsReady=true молча режет OTP.
 */
export function isAuthEmailOnly(): boolean {
  const allow = envFlag(process.env.AUTH_ALLOW_PHONE);
  if (allow === "true") return false;
  if (allow === "false") return true;

  if (hasSmsProviderCredentials()) return false;

  const publicAllow = envFlag(process.env.NEXT_PUBLIC_AUTH_ALLOW_PHONE);
  if (publicAllow === "true") return false;

  return true;
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
  const allow = envFlag(process.env.NEXT_PUBLIC_AUTH_ALLOW_PHONE);
  if (allow === "true") return false;
  if (allow === "false") return true;
  return true;
}
