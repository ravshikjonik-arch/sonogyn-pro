import crypto from "crypto";

import { timingSafeEqual } from "@/lib/security/timing-safe";

/** Поля, которые Telegram подписывает в Login Widget / OAuth redirect. */
export const TELEGRAM_WIDGET_SIGNED_FIELDS = [
  "id",
  "first_name",
  "last_name",
  "username",
  "photo_url",
  "auth_date",
] as const;

export type TelegramSignedField = (typeof TELEGRAM_WIDGET_SIGNED_FIELDS)[number];

export type TelegramPayload = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number | string;
  hash?: string;
  /** Служебное поле приложения — НЕ входит в подпись Telegram. */
  source?: string;
};

/**
 * Проверка HMAC Login Widget.
 * Важно: в check_string только поля Telegram (без source/next/register).
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramWidgetHash(body: TelegramPayload, botToken: string): boolean {
  const hash = body.hash?.trim();
  if (!hash || !botToken.trim()) return false;

  const checkString = TELEGRAM_WIDGET_SIGNED_FIELDS.filter((key) => {
    const value = body[key];
    return value !== undefined && value !== null && String(value) !== "";
  })
    .sort()
    .map((key) => `${key}=${body[key]}`)
    .join("\n");

  if (!checkString) return false;

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
  return timingSafeEqual(computedHash, hash);
}

export function extractTelegramPayloadFromUrl(url: URL): TelegramPayload {
  return {
    id: url.searchParams.get("id") ?? undefined,
    first_name: url.searchParams.get("first_name") ?? undefined,
    last_name: url.searchParams.get("last_name") ?? undefined,
    username: url.searchParams.get("username") ?? undefined,
    photo_url: url.searchParams.get("photo_url") ?? undefined,
    auth_date: url.searchParams.get("auth_date") ?? undefined,
    hash: url.searchParams.get("hash") ?? undefined,
  };
}

export const TELEGRAM_AUTH_ERROR_MESSAGES: Record<string, string> = {
  token: "Telegram не настроен на сервере (TELEGRAM_BOT_TOKEN).",
  hash: "Telegram не подтвердил вход (подпись). Повторите или проверьте /setdomain в BotFather.",
  expired: "Сессия Telegram устарела. Нажмите кнопку входа ещё раз.",
  session: "Не удалось создать сессию после Telegram. Попробуйте снова.",
  denied: "Доступ через этот Telegram ID закрыт для пилота.",
  failed: "Не удалось войти через Telegram. Попробуйте снова.",
  register_expired:
    "Сессия регистрации истекла (15 мин). Снова заполните данные врача и нажмите «Подтвердить через Telegram».",
  needs_registration:
    "Аккаунт не найден. Сначала зарегистрируйтесь: заполните данные врача и подтвердите через Telegram.",
};

export function telegramAuthErrorMessage(code: string | null | undefined, fallback?: string | null): string {
  if (fallback?.trim()) return fallback.trim();
  if (!code) return "";
  return TELEGRAM_AUTH_ERROR_MESSAGES[code] ?? TELEGRAM_AUTH_ERROR_MESSAGES.failed;
}
