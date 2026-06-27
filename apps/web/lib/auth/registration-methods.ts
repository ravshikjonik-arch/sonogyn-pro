import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";

export type AuthRegistrationMethod = "telegram" | "email" | "phone" | "social";

export const REGISTRATION_METHOD_LABELS: Record<AuthRegistrationMethod, string> = {
  telegram: "Telegram",
  email: "Email + пароль",
  phone: "Телефон + SMS",
  social: "Google",
};

export const REGISTRATION_METHOD_HINTS: Record<AuthRegistrationMethod, string> = {
  telegram: "Код в Telegram — быстрее SMS. Сначала откройте бота и нажмите Start.",
  email: "Письмо с подтверждением на почту. Работает из РФ без VPN.",
  phone: "Код по SMS — только номера РФ (+7), через sms.ru. Для +993 и других стран: Telegram или email.",
  social: "Google OAuth. Если Google недоступен — вкладки «Telegram», «Почта» или «Телефон».",
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
