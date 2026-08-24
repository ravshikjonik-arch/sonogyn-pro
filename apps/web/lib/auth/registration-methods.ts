import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";

export type AuthRegistrationMethod = "telegram" | "email" | "phone" | "social";

export const REGISTRATION_METHOD_LABELS: Record<AuthRegistrationMethod, string> = {
  phone: "Телефон + SMS",
  social: "Яндекс ID",
  telegram: "Telegram",
  email: "Email + пароль",
};

export const REGISTRATION_METHOD_HINTS: Record<AuthRegistrationMethod, string> = {
  phone: "SMS на номера РФ (+7) через SMS.ru — дополнительный быстрый вход.",
  social: "Яндекс ID — вход в один клик без ожидания письма. Это основной быстрый сценарий для пилота.",
  telegram:
    "Дополнительный канал: бот и код. Удобно, если врач не хочет ждать SMS.",
  email: "Email и пароль: после регистрации подтвердите почту по ссылке из письма (от Sonogyn-pro@mail.ru).",
};

/** Порядок вкладок на экране входа/регистрации: OAuth первым, email — запасной путь. */
export const AUTH_TAB_ORDER: AuthRegistrationMethod[] = ["social", "phone", "telegram", "email"];

export function parseRegistrationMethod(raw: string | null): AuthRegistrationMethod {
  if (isAuthEmailOnly()) return "email";
  if (raw === "google") return "social";
  if (raw === "email" || raw === "phone" || raw === "telegram" || raw === "social") return raw;
  return "social";
}

/** Имя бота для подсказок в UI (client-safe). */
export function readTelegramBotDisplayName(): string {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return username ? `@${username}` : "@SonogynProBot";
}
