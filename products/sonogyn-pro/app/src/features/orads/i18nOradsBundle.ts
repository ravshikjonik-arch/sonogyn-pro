import type { I18n } from "i18n-js";

import oradsAr from "@repo/orads-us/locales/ar";
import oradsEn from "@repo/orads-us/locales/en";
import oradsEs from "@repo/orads-us/locales/es";
import oradsFr from "@repo/orads-us/locales/fr";
import oradsRu from "@repo/orads-us/locales/ru";

const ORADS_BY_LOCALE = {
  ru: oradsRu.orads,
  en: oradsEn.orads,
  es: oradsEs.orads,
  fr: oradsFr.orads,
  ar: oradsAr.orads,
} as const;

/**
 * Merge @repo/orads-us nested `orads` namespace into the app i18n-js instance.
 * Arabic RTL: UI must mirror layout via I18nManager.isRTL (flexDirection, chevron, progress) — not hardcoded LTR.
 */
export function attachOradsTranslations(i18n: I18n) {
  for (const [loc, orads] of Object.entries(ORADS_BY_LOCALE)) {
    const base = (i18n.translations[loc] ?? {}) as Record<string, unknown>;
    i18n.translations[loc] = { ...base, orads };
  }
}
