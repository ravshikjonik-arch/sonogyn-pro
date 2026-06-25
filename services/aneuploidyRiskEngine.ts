/**
 * Aneuploidy Risk Engine — SonoGyn Pro Obstetric Expert System
 * Этап 6 · T21/T18/T13/Turner/triploidy, NT, NB, DV, TR, maternal age
 */

export {
  assessAneuploidyRisk,
  type AneuploidyRiskInput,
  type AneuploidyRiskOutput,
  type AneuploidyRiskItem,
  type RiskLevel,
  type NasalBoneStatus,
  type DvFlowStatus,
  type TricuspidStatus,
} from "./obstetric-expert/aneuploidyRiskEngine";

export type { GestationalAgeInput, BiometricData } from "./obstetric-expert/types";
