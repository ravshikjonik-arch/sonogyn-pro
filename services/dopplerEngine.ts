/**
 * Fetal Doppler Engine — SonoGyn Pro Obstetric Expert System
 * Этап 5 · UA/MCA/DV/UTA, PI/RI/CPR, FGR patterns
 */

export {
  assessFetalDoppler,
  type DopplerAssessmentInput,
  type DopplerAssessmentOutput,
  type DopplerClassification,
  type DopplerVessel,
  type VesselDopplerResult,
  type CprResult,
  type FgrDopplerPattern,
} from "./obstetric-expert/dopplerEngine";

export type { GestationalAgeInput, DopplerData } from "./obstetric-expert/types";
