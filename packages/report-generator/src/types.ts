/** Unified calculator result for Report Generator (web + mobile). */
export type CalculatorReportPayload = {
  toolId: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  category?: string | number | null;
  timestamp: string;
  locale?: "ru";
};

export type ReportSection = {
  id: string;
  title?: string;
  body: string;
};

export type GeneratedReport = {
  plainText: string;
  sections: ReportSection[];
  /** Field labels still missing in inputs (for UI highlight). */
  missingFields: string[];
  disclaimer: string;
};

export type ReportTemplateFn = (payload: CalculatorReportPayload) => GeneratedReport;
