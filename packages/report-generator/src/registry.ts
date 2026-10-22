import type { CalculatorReportPayload, GeneratedReport, ReportTemplateFn } from "./types";
import { renderBiRadsUsReport } from "./templates/bi-rads-us";
import { renderBishopReport } from "./templates/bishop";
import { renderEfwReport } from "./templates/efw";
import { renderFigoMyomaReport } from "./templates/figo-myoma";
import { renderFmfPreeclampsiaReport } from "./templates/fmf-preeclampsia";
import { renderIotaAdnexReport } from "./templates/iota-adnex";
import { renderOradsUsReport } from "./templates/o-rads-us";
import { renderTiRadsReport } from "./templates/ti-rads";
import { renderVbacReport } from "./templates/vbac";

/** Canonical toolId → template. Aliases: o-rads, iota. */
export const REPORT_TEMPLATE_REGISTRY: Record<string, ReportTemplateFn> = {
  bishop: renderBishopReport,
  vbac: renderVbacReport,
  "fetal-weight": renderEfwReport,
  "o-rads-us": renderOradsUsReport,
  "o-rads": renderOradsUsReport,
  "iota-adnex": renderIotaAdnexReport,
  iota: renderIotaAdnexReport,
  "bi-rads-us": renderBiRadsUsReport,
  "bi-rads": renderBiRadsUsReport,
  "ti-rads": renderTiRadsReport,
  tirads: renderTiRadsReport,
  "figo-myoma": renderFigoMyomaReport,
  figo: renderFigoMyomaReport,
  "fmf-preeclampsia": renderFmfPreeclampsiaReport,
  fmf: renderFmfPreeclampsiaReport,
};

export function listRegisteredReportToolIds(): string[] {
  return Object.keys(REPORT_TEMPLATE_REGISTRY);
}

export function isReportToolRegistered(toolId: string): boolean {
  return toolId in REPORT_TEMPLATE_REGISTRY;
}
