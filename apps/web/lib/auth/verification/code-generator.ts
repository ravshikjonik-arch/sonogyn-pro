import crypto from "crypto";

import { shouldExposeDevSmsOtp, readDevSmsOtpForMock } from "@/lib/auth/dev-sms";

/** 6-значный OTP — только crypto.randomInt (не Math.random: предсказуем на V8). */
export function generateVerificationCode(digits = 6): string {
  // Local dev + SMS mock only — production always uses crypto.randomInt.
  if (shouldExposeDevSmsOtp()) {
    return readDevSmsOtpForMock();
  }
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(digits, "0");
}

/** SHA-256 хеш кода для хранения в Redis/KV (plain text код никогда не пишем в KV). */
export function hashVerificationCode(code: string, pepper: string): string {
  return crypto.createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

/** Хеш контакта для ключей Redis — без email/телефона в ключах (PII). */
export function hashContactIdentifier(value: string): string {
  const normalized = value.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

export function verificationPepper(): string {
  const pepper =
    process.env.VERIFICATION_CODE_PEPPER?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()?.slice(0, 32) ||
    "dev-only-pepper-change-in-production";
  if (process.env.NODE_ENV === "production" && pepper === "dev-only-pepper-change-in-production") {
    // Vercel: без pepper все инстансы должны использовать один секрет из env.
    console.warn("[auth] VERIFICATION_CODE_PEPPER not set in production");
  }
  return pepper;
}
