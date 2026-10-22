export { REPORT_GENERATOR_DISCLAIMER_RU } from "./disclaimer";
export { MISSING_VALUE_RU } from "./placeholders";
export { generateCalculatorReport, UnknownReportToolError } from "./generate";
export {
  isReportToolRegistered,
  listRegisteredReportToolIds,
  REPORT_TEMPLATE_REGISTRY,
} from "./registry";
export type {
  CalculatorReportPayload,
  GeneratedReport,
  ReportSection,
  ReportTemplateFn,
} from "./types";
