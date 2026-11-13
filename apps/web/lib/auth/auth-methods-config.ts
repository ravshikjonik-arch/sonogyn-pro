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
 * Если настроен SMS.ru/Twilio — телефон разрешён (иначе прод с smsReady=true
 * молча отдаёт 503 на /api/auth/phone/send-otp).
 * Без SMS-провайдера: AUTH_ALLOW_PHONE=true включает UI/API, иначе mail-only.
 */
export function isAuthEmailOnly(): boolean {
  // Runtime credentials win over stale AUTH_ALLOW_PHONE / NEXT_PUBLIC_* flags.
  if (hasSmsProviderCredentials()) return false;

  const allow = envFlag(process.env.AUTH_ALLOW_PHONE);
  if (allow === "true") return false;
  if (allow === "false") return true;

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

/**
 * Client-safe (NEXT_PUBLIC_* via next.config env).
 * next.config mirrors SMSRU/Twilio / AUTH_ALLOW_PHONE → NEXT_PUBLIC_AUTH_ALLOW_PHONE
 * so UI and server stay aligned at build time (3C: phone after email in wizard; tab only if allowed).
 */
export function isAuthEmailOnlyClient(): boolean {
  const allow = envFlag(process.env.NEXT_PUBLIC_AUTH_ALLOW_PHONE);
  if (allow === "true") return false;
  if (allow === "false") return true;
  return true;
}
