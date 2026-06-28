import type { ReportLocale } from "@repo/types";

import { en } from "./en";
import { ru } from "./ru";

const catalogs = {
  ru,
  en,
} as const;

export type ReportCatalog = typeof ru | typeof en;

export function getReportI18n(locale: ReportLocale): ReportCatalog {
  return (catalogs[locale] ?? ru) as ReportCatalog;
}

export { en, ru };
