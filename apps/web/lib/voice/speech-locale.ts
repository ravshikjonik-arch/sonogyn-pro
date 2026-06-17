import type { AppLocale } from "@/lib/i18n/locale";

/** BCP-47 для Web Speech API по локалям SonoGyn Pro. */
export const SPEECH_LOCALE_BY_APP: Record<AppLocale, string> = {
  ru: "ru-RU",
  en: "en-US",
  fr: "fr-FR",
  it: "it-IT",
  ar: "ar-SA",
};

export function speechLangForAppLocale(locale: AppLocale): string {
  return SPEECH_LOCALE_BY_APP[locale] ?? "ru-RU";
}
