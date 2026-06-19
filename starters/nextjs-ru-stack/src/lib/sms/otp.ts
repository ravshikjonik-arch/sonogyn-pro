import { createHash, randomInt } from "crypto";

import { getEnv } from "@/lib/env";

/** Генерация OTP-кода фиксированной длины. */
export function generateOtpCode(): string {
  const { SMS_OTP_LENGTH } = getEnv();
  const max = 10 ** SMS_OTP_LENGTH;
  const num = randomInt(0, max);
  return num.toString().padStart(SMS_OTP_LENGTH, "0");
}

/** Хеш OTP для хранения в БД (не храним код в открытом виде). */
export function hashOtpCode(code: string, phone: string): string {
  const pepper = process.env.SMS_OTP_PEPPER ?? "dev-pepper";
  return createHash("sha256").update(`${pepper}:${phone}:${code}`).digest("hex");
}

export function verifyOtpHash(code: string, phone: string, codeHash: string): boolean {
  return hashOtpCode(code, phone) === codeHash;
}

/** Нормализация телефона РФ → E.164 (+7…). */
export function normalizePhoneRu(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return null;
}
