/**
 * Obstetric Expert Copilot — SonoGyn Pro (Woodward 4ed + ISUOG)
 * Этапы 1–10 · единая точка входа
 *
 * @example
 * import { runObstetricCopilot } from "./obstetricCopilot";
 *
 * const out = runObstetricCopilot({
 *   gestationalAge: { weeks: 22 },
 *   findings: ["Вентрикуломегалия 13 мм", "Отсутствует CSP"],
 *   biometricData: { lateralVentricleMm: 13, bpdMm: 52, hcMm: 178, acMm: 168, flMm: 38 },
 *   maternalAgeYears: 32,
 * });
 */

export { runObstetricCopilot, type ObstetricCopilotInput, type ObstetricCopilotOutput } from "./obstetric-expert/obstetricCopilot";

export { assessProtocolCompleteness } from "./obstetric-expert/protocolAssistant";
export { generateIsuogReport, type IsuogStructuredReport } from "./obstetric-expert/isuogReportEngine";
export { buildClinicalDecisionSupport, type ClinicalDecisionSupportOutput, type CdsAction } from "./obstetric-expert/clinicalDecisionSupport";

export { buildDifferentialDiagnosis } from "./differentialDiagnosis";
export { runSonographerCopilot, generateReport } from "./sonographerAssistant";
export { assessFetalBiometry } from "./fetalBiometryEngine";
export { assessFetalDoppler } from "./dopplerEngine";
export { assessAneuploidyRisk } from "./aneuploidyRiskEngine";

export type { GestationalAgeInput, BiometricData, DopplerData } from "./obstetric-expert/types";
