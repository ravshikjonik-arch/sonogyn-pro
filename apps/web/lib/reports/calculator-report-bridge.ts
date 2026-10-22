import {
  generateCalculatorReport,
  isReportToolRegistered,
  type CalculatorReportPayload,
  type GeneratedReport,
} from "@repo/report-generator";

export function buildCalculatorGeneratedReport(
  toolId: string,
  inputs: Record<string, unknown>,
  outputs: Record<string, unknown>,
  category?: string | number | null,
): GeneratedReport | null {
  if (!isReportToolRegistered(toolId)) return null;
  const payload: CalculatorReportPayload = {
    toolId,
    inputs,
    outputs,
    category,
    timestamp: new Date().toISOString(),
    locale: "ru",
  };
  return generateCalculatorReport(payload);
}
