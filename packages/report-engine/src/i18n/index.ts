import type { ReportLocale } from "@repo/types";

import { en } from "./en";
import { ru } from "./ru";

const catalogs = {
  ru,
  en,
} as const;

export type ReportCatalog = typeof ru;

export function getReportI18n(locale: ReportLocale): ReportCatalog {
  return catalogs[locale] ?? ru;
}

export { en, ru };
