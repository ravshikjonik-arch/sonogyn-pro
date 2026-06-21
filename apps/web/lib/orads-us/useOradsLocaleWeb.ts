"use client";

import type { OradsLocaleCode } from "@repo/orads-us";
import { useMemo } from "react";

import { createOradsWebTranslator } from "./locale";

/** Web O-RADS wizard strings from `@repo/orads-us/locales`. */
export function useOradsLocaleWeb(locale: OradsLocaleCode = "ru") {
  return useMemo(() => {
    const t = createOradsWebTranslator(locale);
    const rtl = t("orads.meta.rtl") === "true";
    return { t, locale, rtl };
  }, [locale]);
}

export type OradsLocaleWeb = ReturnType<typeof useOradsLocaleWeb>;
