import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";

export type AuthRegistrationMethod = "telegram" | "email" | "phone" | "social";

export const REGISTRATION_METHOD_LABELS: Record<AuthRegistrationMethod, string> = {
  phone: "Телефон + SMS",
  social: "Яндекс ID",
  telegram: "Telegram",
  email: "Email + пароль",
};

export const REGISTRATION_METHOD_HINTS: Record<AuthRegistrationMethod, string> = {
  phone: "SMS на номера РФ (+7) через SMS.ru — основной способ по 199-ФЗ.",
  social: "Яндекс ID — российский аккаунт в один клик. VK ID подключим отдельной интеграцией позже.",
  telegram:
    "Доп. канал: бот и код. Для новых пользователей предпочтительнее SMS или Яндекс ID.",
  email: "Восстановление и уведомления. Для первого входа лучше SMS или Яндекс ID.",
};

/** Порядок вкладок на экране входа/регистрации (SMS первым). */
export const AUTH_TAB_ORDER: AuthRegistrationMethod[] = ["phone", "social", "telegram", "email"];

export function parseRegistrationMethod(raw: string | null): AuthRegistrationMethod {
  if (isAuthEmailOnly()) return "email";
  if (raw === "google") return "social";
  if (raw === "email" || raw === "phone" || raw === "telegram" || raw === "social") return raw;
  return "phone";
}

/** Имя бота для подсказок в UI (client-safe). */
export function readTelegramBotDisplayName(): string {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return username ? `@${username}` : "@Sonogyn_bot";
}
