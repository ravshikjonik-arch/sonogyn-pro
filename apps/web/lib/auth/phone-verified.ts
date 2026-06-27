import type { User } from "@supabase/supabase-js";

import { TELEGRAM_EMAIL_DOMAIN } from "@/lib/auth/telegram-custom-auth";

const PHONE_EMAIL_DOMAIN = "phone.sonogyn.app";

/** Прочитать phoneVerified из user_metadata (camelCase + snake_case). */
export function readPhoneVerified(user: Pick<User, "user_metadata" | "phone_confirmed_at">): boolean {
  const meta = user.user_metadata ?? {};
  if (meta.phone_verified === true || meta.phoneVerified === true) return true;
  if (user.phone_confirmed_at) return true;
  return false;
}

/** Вход по SMS создаёт phone_*@phone.sonogyn.app — считаем телефон уже подтверждённым. */
export function isPhonePrimaryAuth(user: Pick<User, "email" | "user_metadata">): boolean {
  const meta = user.user_metadata ?? {};
  if (meta.provider === "sms") return true;
  if (typeof meta.phone_e164 === "string" && meta.phone_e164.length > 0 && meta.provider === "sms") return true;
  const email = user.email ?? "";
  return email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

/** Вход через Telegram OTP — канал уже подтверждён, телефон не обязателен (как SMS-primary). */
export function isTelegramPrimaryAuth(user: Pick<User, "email" | "user_metadata">): boolean {
  const meta = user.user_metadata ?? {};
  if (meta.provider === "telegram" && typeof meta.telegram_id === "string" && meta.telegram_id.length > 0) {
    return true;
  }
  const email = user.email ?? "";
  return email.endsWith(`@${TELEGRAM_EMAIL_DOMAIN}`);
}

/** Нужна страница /verify-phone (Google, email — без подтверждённого телефона). */
export function needsPhoneVerification(user: Pick<User, "email" | "user_metadata" | "phone_confirmed_at">): boolean {
  if (readPhoneVerified(user)) return false;
  if (isPhonePrimaryAuth(user)) return false;
  if (isTelegramPrimaryAuth(user)) return false;
  return true;
}

export function phoneVerifiedMetadataPatch(): Record<string, boolean | string> {
  return { phone_verified: true, phoneVerified: true };
}
