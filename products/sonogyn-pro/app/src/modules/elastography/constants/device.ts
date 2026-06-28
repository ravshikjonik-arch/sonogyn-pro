/**
 * Диапазоны калибровки УЗ-приборов для предупреждений.
 */

import { HARD_LIMITS } from "@repo/medical-calculations/elastography";

/** Пороговые значения для предупреждений о калибровке прибора (внутри HARD_LIMITS). */
export const DEVICE_CALIBRATION = {
  kpa: { softMin: HARD_LIMITS.kPa.min, softMax: 180, warnAbove: 200 },
  strainRatio: { min: HARD_LIMITS.strainRatio.min, max: 15, warnAbove: 12 },
  cci: { min: HARD_LIMITS.stiffnessIndex.min, max: HARD_LIMITS.stiffnessIndex.max },
} as const;
