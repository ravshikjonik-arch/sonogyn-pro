export type {
  OradsCategoryLabel,
  OradsCategoryNumber,
  OradsColorCode,
  OradsDecisionNode,
  OradsDecisionOption,
  OradsLocaleCode,
  OradsTreePathStep,
  OradsTreeResult,
} from "./types";

export { ORADS_COLOR_BY_CATEGORY, ORADS_ROM_BY_CATEGORY, oradsResult } from "./results";

export {
  getOradsDecisionNode,
  ORADS_DECISION_TREE,
  ORADS_DECISION_TREE_NODES,
  ORADS_TREE_OPTIONAL_ENTRY_ID,
  ORADS_TREE_ROOT_ID,
  STEP0_TECHNICAL,
} from "./oradsDecisionTree";

export { collectOradsTreeLocaleKeys, findOradsOption, walkOradsDecisionTree } from "./treeWalker";
export type { WalkOradsTreeResult } from "./treeWalker";

export {
  appendOradsNavigatorStep,
  getOradsNavigatorTerminalResult,
  oradsNavigatorReducer,
  ORADS_NAVIGATOR_INITIAL_STATE,
  resolveOradsNavigatorView,
  resolveOradsNavigatorViewFromPath,
  useOradsNavigator,
  type OradsNavigatorAction,
  type OradsNavigatorState,
  type OradsNavigatorView,
  type UseOradsNavigatorOptions,
  type UseOradsNavigatorReturn,
} from "./navigator";
export { ORADS_ATLAS_PAGE_FALLBACK, ORADS_ATLAS_TOPIC_BY_REF } from "./atlasImageMap";
export { calculateOradsResult } from "./calculateOradsResult";
export type {
  CalculateOradsResult,
  CalculateOradsResultFailure,
  CalculateOradsResultSuccess,
  OradsResult,
  UserAnswer,
  UserAnswers,
} from "./calculateOradsResult";
export { buildOradsPathSummary } from "./pathSummary";
export { flattenLocaleKeys, getNestedLocaleValue } from "./localeUtils";

export {
  hintsToPath,
  mapExtractedToHints,
  parseAndMapOradsHints,
  parseOradsProtocolText,
  type HintConfidence,
  type OradsExtractedInput,
  type OradsHintsResult,
  type OradsWizardHint,
} from "./extractedToHints";
export type { OradsAscites, OradsContour, OradsSeptations, OradsVascularity } from "./parseOradsProtocolText";

export {
  getOradsReferat,
  getOradsNosologyById,
  getOradsNosologyBySubtype,
  getReferatCaseIdForImageRef,
  getReferatImagePath,
  getReferatSectionIdForWizardNode,
  isOradsNosologyPending,
  ORADS_NOSOLOGY_ATLAS,
  ORADS_NOSOLOGY_PENDING_SUBTYPES,
  ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE,
  ORADS_REFERAT_CAPTION_BY_REF,
  ORADS_REFERAT_IMAGE_BY_REF,
  ORADS_REFERAT_LOCALES,
  ORADS_REFERAT_PUBLIC_IMAGE_BASE,
  ORADS_REFERAT_RU,
  referatGuideHref,
  resolveOradsNosologyImageUri,
} from "../education";
export type { OradsReferatLocale } from "../education";
export type { OradsNosologyAtlasEntry, OradsNosologySubtype } from "../education";
export type {
  OradsReferatCase,
  OradsReferatCategoryRow,
  OradsReferatDocument,
  OradsReferatSection,
} from "../education";

export type { OradsProtocolDraftSource } from "./assist/types";
export { buildOradsProtocolDraft, ORADS_PROTOCOL_DRAFT_DISCLAIMER } from "./assist/buildProtocolDraft";
export {
  resolveOradsAssistContext,
  type OradsAgeSource,
  type OradsAssistContext,
  type OradsMenopauseSource,
  type ResolveOradsAssistContextInput,
} from "./assist/resolveOradsAssistContext";
export { runOradsAssistPipeline, type OradsAssistPipelineResult } from "./assist/runOradsAssistPipeline";
export {
  applyOradsClinicalMemory,
  type OradsClinicalMemoryInsight,
  type OradsClinicalReasoningQuestion,
  type OradsClinicalReasoningResult,
  type OradsClinicalReasoningStep,
} from "./assist/clinicalReasoning";

/** Supported locale bundle file names (Phase 2 UI loads JSON by code). */
export const ORADS_LOCALE_CODES = ["ru", "en", "es", "fr", "ar"] as const;
