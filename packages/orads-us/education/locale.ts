import referatEn from "./referat.en.json";
import referatRu from "./referat.ru.json";
import type { OradsReferatDocument } from "./types";

export type OradsReferatLocale = "ru" | "en";

const BY_LOCALE: Record<OradsReferatLocale, OradsReferatDocument> = {
  ru: referatRu as OradsReferatDocument,
  en: referatEn as OradsReferatDocument,
};

/** Resolve referat bundle; falls back to English, then Russian. */
export function getOradsReferat(locale: string): OradsReferatDocument {
  if (locale === "ru" || locale.startsWith("ru")) return BY_LOCALE.ru;
  if (locale === "en" || locale.startsWith("en")) return BY_LOCALE.en;
  return BY_LOCALE.en;
}

export const ORADS_REFERAT_LOCALES: OradsReferatLocale[] = ["ru", "en"];
