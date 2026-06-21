import type { OradsLocaleCode } from "@repo/orads-us";
import { getNestedLocaleValue } from "@repo/orads-us";
import oradsEn from "@repo/orads-us/locales/en";
import oradsRu from "@repo/orads-us/locales/ru";

const ROOTS: Record<OradsLocaleCode, Record<string, unknown>> = {
  ru: oradsRu.orads as Record<string, unknown>,
  en: oradsEn.orads as Record<string, unknown>,
  es: oradsRu.orads as Record<string, unknown>,
  fr: oradsRu.orads as Record<string, unknown>,
  ar: oradsRu.orads as Record<string, unknown>,
};

function interpolate(template: string, options?: Record<string, string | number>): string {
  if (!options) return template;
  return template.replace(/%\{(\w+)\}/g, (_, key: string) => String(options[key] ?? ""));
}

/** Resolve O-RADS tree i18n keys for web (Phase 1 · ru/en). */
export function createOradsWebTranslator(locale: OradsLocaleCode = "ru") {
  const root = ROOTS[locale] ?? ROOTS.ru;

  return function t(key: string, options?: Record<string, string | number>): string {
    const raw = getNestedLocaleValue(root, key.startsWith("orads.") ? key : `orads.${key}`);
    if (!raw) return key;
    return interpolate(raw, options);
  };
}

export type OradsWebTranslator = ReturnType<typeof createOradsWebTranslator>;
