export {
  FETAL_ANATOMY_MODULE_ID,
  FETAL_ANATOMY_MODULE_TITLE,
  FETAL_ANATOMY_MODULE_TITLE_RU,
  FETAL_ANATOMY_DISCLAIMER,
  FETAL_ANATOMY_SOURCE,
  FETAL_ANATOMY_IMAGE_BASE,
  FETAL_ANATOMY_LINKS,
  FETAL_ANATOMY_REGION_LABELS,
} from "./constants";

export {
  FETAL_ANATOMY_VIEWS,
  FETAL_ANATOMY_VIEW_COUNT,
  getFetalAnatomyView,
  viewsByRegion,
} from "./views";

export { FETAL_ANATOMY_ANOMALIES, FETAL_ANATOMY_ANOMALY_COUNT, searchAnomalies, getAnomaly, anomaliesForView } from "./anomalies";
export { FETAL_ANATOMY_CASES, casesByLevel } from "./cases";
export { FETAL_ANATOMY_QUIZ_BANK, FETAL_ANATOMY_ORAL_QUESTIONS } from "./quiz-bank";
export { FETAL_ANATOMY_EXAM_BLUEPRINT } from "./exam-blueprint";
export { FETAL_ANATOMY_SURVEY_ALGORITHM, FETAL_ANATOMY_INTRODUCTION, FETAL_ANATOMY_LEMON_SIGN_ALGORITHM } from "./algorithms";
export {
  FETAL_ANATOMY_PROGRESS_KEY,
  FETAL_ANATOMY_ISUOG_LECTURE_ID,
  FETAL_ANATOMY_CORE_TOPIC_IDS,
  ISUOG_TOPIC_TO_VIEW_IDS,
  VIEW_ID_TO_ISUOG_TOPIC,
  loadViewProgress,
  loadIsuogTopicProgress,
  loadModuleExtraProgress,
  setViewDone,
  setModuleExtraSectionDone,
  toggleModuleExtraSection,
  viewProgressPercent,
  fetalAnatomyCoreProgressPercent,
  fetalAnatomyFullModuleProgressPercent,
  fetalAnatomyProgressSummary,
  topicProgressForView,
  syncViewsFromIsuogTopic,
  notifyFetalAnatomyProgressChange,
  isCoreTopicDone,
} from "./progress";
export { FETAL_ANATOMY_ATLAS, fetalAnatomyAtlasSrc, fetalAnatomyAtlasFallbackSrc } from "./atlas";
export { FETAL_ANATOMY_MODULE_MANIFEST, buildFetalAnatomyKnowledgeJson } from "./module-manifest";
export {
  FETAL_ANATOMY_EDUCATIONAL_CARDS,
  FETAL_ANATOMY_INTRODUCTION_CARD,
  getEducationalCard,
} from "./educational-mode";
export { FETAL_ANATOMY_GLOSSARY, searchGlossary } from "./glossary";
export { FETAL_ANATOMY_KNOWLEDGE_BASE, searchKnowledgeBase } from "./knowledge-base";

export type {
  FetalAnatomyView,
  FetalAnatomyViewId,
  FetalAnatomyRegion,
  FetalAnomalyRecord,
  FetalAnatomyCase,
  FetalAnatomyCaseLevel,
} from "./types";
