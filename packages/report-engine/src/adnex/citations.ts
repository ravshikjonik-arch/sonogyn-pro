import {
  ORADS_US_PRIMARY_SOURCES,
  ORADS_US_VERSION,
  SUPPLEMENTARY_READING,
} from "@repo/adnex-education";
import type { ReportCitation } from "@repo/types";

export function buildAdnexReportCitations(): ReportCitation[] {
  const primary: ReportCitation[] = ORADS_US_PRIMARY_SOURCES.map((label, i) => ({
    id: `orads-primary-${i + 1}`,
    standard: "ACR / IOTA / ISUOG",
    version: ORADS_US_VERSION,
    label,
  }));

  const supplementary: ReportCitation[] = SUPPLEMENTARY_READING.map((item) => ({
    id: item.id,
    standard: "Supplementary reading",
    label: item.citation,
    url: item.href,
    quote: item.note,
  }));

  return [...primary, ...supplementary];
}

export { ORADS_US_VERSION };
