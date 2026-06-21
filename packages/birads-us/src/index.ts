export {
  BI_RADS_VERSION,
  biradsOptions,
  buildBiradsDecisionPath,
  evaluateBirads,
  type BiradsInput,
} from "./birads-core";

export {
  BIRADS_BROCHURE_SOURCE,
  BIRADS_BROCHURE_STEPS,
  BIRADS_CATEGORY_RECOMMENDATIONS,
  brochureOptions,
  buildBiradsBrochureChecklist,
  buildBiradsBrochureProtocol,
  defaultBiradsBrochureInput,
  evaluateBiradsBrochure,
  resolveBiradsBrochureCategory,
  type BiradsBrochureInput,
} from "./biradsBrochure2025";

export type { RiskResult, RuleSetConfig, SelectOption } from "./types";

export { BIRADS_CATEGORIES, categoryMeta, parseCategoryCode, type BiradsCategoryCode, type BiradsCategoryMeta } from "./knowledge/categories";
export {
  BIRADS_PATHOLOGY_LIBRARY,
  searchPathology,
  type BiradsPathologyEntry,
  type BiradsPathologyId,
} from "./knowledge/differential";
export { BIRADS_ATLAS_INTRO, atlasCategoryTabs, atlasPathologies, pathologyImageUrl } from "./knowledge/atlas";

export { enrichEngineResult, matchDifferential, type BiradsEngineInput, type BiradsEngineOutput } from "./engine/enrich-result";
export { generateStructuredReport, type StructuredBiradsReport } from "./engine/structured-report";
export { assistFromFreeText, parseBiradsFreeText, type NlpAssistResult } from "./engine/nlp-assist";
export { mergeParsedBiradsInput, presetForPathology, BIRADS_PATHOLOGY_PRESETS } from "./engine/merge-input";
