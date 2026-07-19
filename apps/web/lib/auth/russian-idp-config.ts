/**
 * Контур авторизации для пользователей из РФ (199-ФЗ / КоАП 13.55).
 * SMS.ru + VK ID + Яндекс ID — baseline; Google отключён; Telegram — вторичный канал.
 */

const TRUE = new Set(["true", "1", "yes"]);

function parseFlag(raw: string | undefined): boolean | undefined {
  if (!raw?.trim()) return undefined;
  return TRUE.has(raw.trim().toLowerCase());
}

/** По умолчанию true: российский контур IdP. */
export function isRussianIdpOnly(): boolean {
  return (
    parseFlag(process.env.AUTH_RU_IDP_ONLY) ??
    parseFlag(process.env.NEXT_PUBLIC_AUTH_RU_IDP_ONLY) ??
    true
  );
}

export function isRussianIdpOnlyClient(): boolean {
  return (
    parseFlag(process.env.NEXT_PUBLIC_AUTH_RU_IDP_ONLY) ?? true
  );
}

/** Провайдеры OAuth, разрешённые в UI (без Google). */
export const RUSSIAN_OAUTH_PROVIDERS = ["vk", "yandex"] as const;
export type RussianOauthProvider = (typeof RUSSIAN_OAUTH_PROVIDERS)[number];

export function isRussianOauthProvider(value: string): value is RussianOauthProvider {
  return (RUSSIAN_OAUTH_PROVIDERS as readonly string[]).includes(value);
}
