import { calculateAdnex, mapSreToAdnexInput } from "@repo/iota-models";
import type { AdnexStructuredReportInput, ReportLocale } from "@repo/types";

import { getReportI18n } from "../i18n";

/** Optional ADNEX malignancy line when SRE fields suffice for deterministic model. */
export function formatAdnexModelLine(input: AdnexStructuredReportInput, locale: ReportLocale = "ru"): string | null {
  const partial = mapSreToAdnexInput(input);
  const result = calculateAdnex(partial);
  if ("errors" in result) return null;
  const pct = (result.malignancyRisk * 100).toFixed(1);
  const t = getReportI18n(locale);
  return t.adnex.adnex_model_line(pct, result.usedCa125);
}
