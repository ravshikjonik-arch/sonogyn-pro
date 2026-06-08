/**
 * Адаптер мобильного модуля: прокидывает активные cut-off из Remote Config в общий пакет.
 */
import {
  calculateBreast,
  calculateCervix,
  calculateMyometrium,
  calculateOvary,
  ElastographyInputError,
  HARD_LIMITS,
  runElastographyCalculator as runCore,
  assertInRange,
  assertOptionalInRange,
  validateBreastInput,
  validateCervixInput,
  validateElastographyInput,
  validateMyometriumInput,
  validateOvaryInput,
} from "@repo/medical-calculations/elastography";
import { getActiveCutoffs } from "../remoteConfig/activeCutoffs";
import type { ElastographyCalculatorResult, ElastographyInput } from "../types";

export function runElastographyCalculator(input: ElastographyInput): ElastographyCalculatorResult {
  return runCore(input, getActiveCutoffs());
}

export {
  calculateBreast,
  calculateCervix,
  calculateMyometrium,
  calculateOvary,
  ElastographyInputError,
  HARD_LIMITS,
  assertInRange,
  assertOptionalInRange,
  validateBreastInput,
  validateCervixInput,
  validateElastographyInput,
  validateMyometriumInput,
  validateOvaryInput,
};
export type { HardLimit } from "@repo/medical-calculations/elastography";
