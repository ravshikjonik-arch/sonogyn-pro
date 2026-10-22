import { REPORT_GENERATOR_DISCLAIMER_RU } from "./disclaimer";
import { REPORT_TEMPLATE_REGISTRY } from "./registry";
import type { CalculatorReportPayload, GeneratedReport } from "./types";

export class UnknownReportToolError extends Error {
  constructor(toolId: string) {
    super(`Report Generator: unknown toolId "${toolId}"`);
    this.name = "UnknownReportToolError";
  }
}

function ensureDisclaimer(report: GeneratedReport): GeneratedReport {
  const disclaimer = REPORT_GENERATOR_DISCLAIMER_RU;
  if (report.plainText.includes(disclaimer)) {
    return { ...report, disclaimer };
  }
  return {
    ...report,
    disclaimer,
    plainText: `${report.plainText.trim()}\n\n${disclaimer}`,
  };
}

export function generateCalculatorReport(payload: CalculatorReportPayload): GeneratedReport {
  const fn = REPORT_TEMPLATE_REGISTRY[payload.toolId];
  if (!fn) throw new UnknownReportToolError(payload.toolId);
  return ensureDisclaimer(fn(payload));
}
