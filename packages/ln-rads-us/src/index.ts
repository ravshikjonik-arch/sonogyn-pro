export {
  LN_RADS_VERSION,
  LN_RADS_CATEGORIES,
  categoryMeta,
  type LnRadsCategoryMeta,
} from "./knowledge/categories";

export {
  evaluateLnRads,
  defaultLnRadsInput,
  lnRadsOptions,
} from "./ln-rads-core";

export type {
  LnRadsInput,
  LnRadsResult,
  LnRadsCategory,
  LnShape,
  LnCapsule,
  LnHilum,
  LnCortex,
  LnEchogenicity,
  LnArchitecture,
  LnVascularity,
  LnCalcifications,
  LnNecrosis,
  LnAnatomicalRegion,
  LnPatternId,
  LnSizeAnalysis,
  LnDopplerAnalysis,
  LnReportLevel,
  LnReportTemplate,
} from "./types";

export { analyzeSize } from "./engine/size-analysis";
export { analyzeDoppler, DOPPLER_OPTIONS, dopplerScoreContribution } from "./engine/doppler";
export {
  enrichEngineResult,
  matchDifferential,
  buildDifferential,
  recognizePattern,
  type LnEngineOutput,
  type LnDifferentialResult,
  type LnPatternRecognitionResult,
} from "./engine/enrich-result";
export { generateStructuredReport, reportTemplates, type StructuredLnReport } from "./engine/structured-report";

export {
  LN_PATHOLOGY_LIBRARY,
  searchPathology,
  PATTERN_TO_PATHOLOGY,
  type LnPathologyEntry,
  type LnPathologyId,
} from "./knowledge/pathology";

export { LN_ATLAS_INTRO, LN_ATLAS_ENTRIES, atlasImageUrl, atlasByShape, type LnAtlasEntry } from "./knowledge/atlas";
export {
  ANATOMY_REGIONS,
  HEAD_NECK_LEVELS,
  THYROID_CANCER_TYPES,
  GYN_CORRELATIONS,
  type LnAnatomyRegion,
} from "./knowledge/anatomy";
export { LN_ACADEMY_SECTIONS, getAcademySection, type LnAcademySection } from "./knowledge/academy";
export { LN_CASE_LIBRARY, casesByDifficulty, type LnCaseStudy, type LnCaseDifficulty } from "./knowledge/cases";
export {
  LN_ASSESSMENT_QUESTIONS,
  questionsByType,
  type LnAssessmentQuestion,
  type LnQuestionType,
} from "./knowledge/assessment";
export { LN_GLOSSARY, searchGlossary, type LnGlossaryEntry } from "./knowledge/glossary";
