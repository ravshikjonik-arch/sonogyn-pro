/**
 * Fetal Biometry Engine — SonoGyn Pro Obstetric Expert System
 * Этап 4 · BPD/HC/AC/FL/HL/EFW, Hadlock / INTERGROWTH / WHO percentiles
 *
 * @example
 * import { assessFetalBiometry } from "./fetalBiometryEngine";
 *
 * const bio = assessFetalBiometry({
 *   gestationalAge: { weeks: 22 },
 *   bpdMm: 52, hcMm: 178, acMm: 168, flMm: 38,
 *   standard: "intergrowth",
 * });
 */

export {
  assessFetalBiometry,
  type BiometryStandard,
  type BiometryMeasurementResult,
  type FetalBiometryInput,
  type FetalBiometryOutput,
  type GrowthClassification,
} from "./obstetric-expert/fetalBiometryEngine";

export type { GestationalAgeInput, BiometricData } from "./obstetric-expert/types";
