import type { ReportLocale } from "@repo/types";

import { ru, type RuCatalog } from "./ru";

const catalogs: Partial<Record<ReportLocale, RuCatalog>> = {
  ru,
};

export function getReportI18n(locale: ReportLocale): RuCatalog {
  return catalogs[locale] ?? ru;
}
