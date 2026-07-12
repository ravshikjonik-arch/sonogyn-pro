/**
 * Российские способы авторизации (199-ФЗ / КоАП 13.55).
 * SMS.ru + VK ID + Яндекс ID — baseline; Google/Apple/Telegram Login как IdP — риск.
 */

const FALSE = new Set(["false", "0", "no"]);

function parseFlag(raw: string | undefined): boolean | undefined {
  if (!raw?.trim()) return undefined;
  return !FALSE.has(raw.trim().toLowerCase());
}

/** По умолчанию true в production — только российские IdP в UI. */
export function isAuthRuIdpOnly(): boolean {
  return (
    parseFlag(process.env.AUTH_RU_IDP_ONLY) ??
    parseFlag(process.env.NEXT_PUBLIC_AUTH_RU_IDP_ONLY) ??
    process.env.NODE_ENV === "production"
  );
}

export function isAuthRuIdpOnlyClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_RU_IDP_ONLY?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  // Client bundle: default on unless explicitly disabled
  return true;
}

export function isVkIdConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VK_CLIENT_ID?.trim());
}

export function isYandexIdConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID?.trim());
}

export const RU_IDP_SUBTITLE =
  "SMS на +7, Яндекс ID, Telegram или email — способы входа для пилота.";

export const RU_IDP_REGISTER_SUBTITLE =
  "Регистрация: SMS (+7), Яндекс ID, Telegram или email. VK подключим отдельной интеграцией позже.";
