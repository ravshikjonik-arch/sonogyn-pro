import type { ElastographyCutoffs } from "../config/defaultCutoffs";
import { DEFAULT_ELASTOGRAPHY_CUTOFFS } from "../config/defaultCutoffs";
import type {
  BreastInput,
  CervixInput,
  ElastographyCalculatorResult,
  ElastographyInput,
  MyometriumInput,
  OvaryInput,
} from "../types";
import { calculateBreast } from "./breast";
import { calculateCervix } from "./cervix";
import { calculateMyometrium } from "./myometrium";
import { calculateOvary } from "./ovary";

export { calculateBreast, calculateCervix, calculateMyometrium, calculateOvary };

/** Единая точка расчёта по органу с injectable cut-off */
export function runElastographyCalculator(
  input: ElastographyInput,
  cutoffs: ElastographyCutoffs = DEFAULT_ELASTOGRAPHY_CUTOFFS,
): ElastographyCalculatorResult {
  switch (input.organ) {
    case "cervix":
      return calculateCervix(input.data as CervixInput, cutoffs);
    case "myometrium":
      return calculateMyometrium(input.data as MyometriumInput, cutoffs);
    case "ovary":
      return calculateOvary(input.data as OvaryInput, cutoffs);
    case "breast":
      return calculateBreast(input.data as BreastInput, cutoffs);
    default:
      throw new Error("Organ not supported");
  }
}

export {
  HARD_LIMITS,
  ElastographyInputError,
  assertInRange,
  assertOptionalInRange,
} from "../utils/validators";
export type { HardLimit } from "../utils/validators";
export {
  validateBreastInput,
  validateCervixInput,
  validateElastographyInput,
  validateMyometriumInput,
  validateOvaryInput,
} from "./validateInput";
