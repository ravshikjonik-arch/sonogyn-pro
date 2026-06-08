import {
  DEFAULT_ELASTOGRAPHY_CUTOFFS,
  ElastographyInputError,
  runElastographyCalculator,
  type ElastographyCalculatorResult,
  type ElastographyCutoffs,
  type ElastographyInput,
} from "@repo/medical-calculations/elastography";

export function runWebElastography(
  input: ElastographyInput,
  cutoffs: ElastographyCutoffs = DEFAULT_ELASTOGRAPHY_CUTOFFS,
): ElastographyCalculatorResult {
  return runElastographyCalculator(input, cutoffs);
}

export { DEFAULT_ELASTOGRAPHY_CUTOFFS, ElastographyInputError };
export type { ElastographyCalculatorResult, ElastographyInput };
