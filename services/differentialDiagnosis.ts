/**
 * Differential Diagnosis Engine — SonoGyn Pro Obstetric Expert System
 * Этап 2 · Woodward knowledge base + clinical rules
 *
 * @example
 * import { buildDifferentialDiagnosis } from "./differentialDiagnosis";
 *
 * const dx = buildDifferentialDiagnosis({
 *   gestationalAge: { weeks: 22 },
 *   findings: [
 *     "Вентрикуломегалия 13 мм",
 *     "Отсутствует CSP",
 *   ],
 *   biometricData: { lateralVentricleMm: 13 },
 * });
 */

export {
  buildDifferentialDiagnosis,
  generateDifferential,
  type DifferentialInput,
  type DifferentialOutput,
  type DifferentialResultItem,
} from "./obstetric-expert/differentialEngine";

export type {
  GestationalAgeInput,
  BiometricData,
  DopplerData,
} from "./obstetric-expert/types";

export { normalizeFindings, collectAllTokens } from "./obstetric-expert/findingSynonyms";
export { CLINICAL_RULES } from "./obstetric-expert/clinicalRules";
