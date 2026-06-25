/**
 * AI Sonographer Assistant — SonoGyn Pro Obstetric Expert System
 * Этап 3 · не чат: структурированный clinical copilot
 *
 * @example
 * import { runSonographerCopilot } from "./sonographerAssistant";
 *
 * const out = runSonographerCopilot({
 *   gestationalAge: { weeks: 22 },
 *   findings: ["Вентрикуломегалия 13 мм", "Отсутствует CSP"],
 *   biometricData: { lateralVentricleMm: 13 },
 * });
 */

export {
  analyzeFinding,
  generateDifferential,
  suggestMeasurements,
  suggestAdditionalViews,
  generateReport,
  runSonographerCopilot,
  type SonographerContext,
  type FindingAnalysis,
  type MeasurementSuggestion,
  type ViewSuggestion,
  type ReportFormat,
  type GeneratedReport,
  type ReportInput,
} from "./obstetric-expert/sonographerAssistant";

export { buildProtocolChecklist, resolveProtocolWindow } from "./obstetric-expert/protocolChecklists";
