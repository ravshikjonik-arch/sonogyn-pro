import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";

export type AuthRegistrationMethod = "telegram" | "email" | "phone" | "social";

export const REGISTRATION_METHOD_LABELS: Record<AuthRegistrationMethod, string> = {
  telegram: "Telegram",
  email: "Email + пароль",
  phone: "Телефон + SMS",
  social: "Google",
};

export const REGISTRATION_METHOD_HINTS: Record<AuthRegistrationMethod, string> = {
  telegram:
    "Пилот: одна кнопка Telegram — ID и @ник вводить не нужно. Сначала Start у @SonogynProBot.",
  email: "Письмо с подтверждением на почту. Работает из РФ без VPN.",
  phone: "SMS на номера РФ (+7) — обычно 10–30 сек. Для других стран используйте Telegram.",
  social: "Google OAuth. Если Google недоступен — вкладка «Telegram».",
};

export function parseRegistrationMethod(raw: string | null): AuthRegistrationMethod {
  if (isAuthEmailOnly()) return "email";
  if (raw === "email" || raw === "phone" || raw === "social" || raw === "telegram") return raw;
  return "telegram";
}

/** Имя бота для подсказок в UI (client-safe). */
export function readTelegramBotDisplayName(): string {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return username ? `@${username}` : "@SonogynProBot";
}
