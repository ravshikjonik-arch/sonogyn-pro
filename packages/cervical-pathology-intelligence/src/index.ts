export * from "./types";
export {
  runCpiClinicalDecision,
  getCpiRulesDocument,
  getCpiGuidelineSources,
} from "./engine/decision-engine";
export { evaluateRuleCondition, evaluateClinicalRules } from "./engine/rules-engine";
export { enrichCpiContext } from "./blocks/enrich-context";
export type { CpiEnrichedContext } from "./blocks/enrich-context";
export { CPI_ACTION_LABELS_RU, CPI_DISCLAIMER } from "./types";
