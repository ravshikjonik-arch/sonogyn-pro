export {
  FETAL_DOPPLER_MODULE_ID,
  FETAL_DOPPLER_DISCLAIMER,
  FETAL_DOPPLER_SOURCE,
  FETAL_DOPPLER_IMAGE_BASE,
  FETAL_DOPPLER_LINKS,
  FETAL_DOPPLER_ATLAS_FILES,
} from "./constants";

export { FETAL_DOPPLER_SECTIONS, getFetalDopplerSection } from "./sections";
export { FETAL_DOPPLER_EDUCATIONAL_CARDS, getEducationalCard } from "./educational-mode";
export { FETAL_DOPPLER_CASES, casesByLevel } from "./cases";
export { FETAL_DOPPLER_ALGORITHMS } from "./algorithms";
export { FETAL_DOPPLER_GLOSSARY, searchGlossary } from "./glossary";
export { FETAL_DOPPLER_KNOWLEDGE_BASE, searchKnowledgeBase } from "./knowledge-base";
export {
  FETAL_DOPPLER_QUIZ_BANK,
  FETAL_DOPPLER_ORAL_QUESTIONS,
} from "./quiz-bank";
export {
  FETAL_DOPPLER_CORE_TOPIC_IDS,
  FETAL_DOPPLER_ISUOG_LECTURE_ID,
  FETAL_DOPPLER_MODULE_EXTRA_PROGRESS_KEY,
  FETAL_DOPPLER_MODULE_ONLY_SECTIONS,
  FETAL_DOPPLER_TOPIC_TO_SECTION,
  fetalDopplerCoreProgressPercent,
  fetalDopplerFullModuleProgressPercent,
  fetalDopplerProgressSummary,
  isCoreTopicDone,
  isFetalDopplerSectionDone,
  isuogTopicKey,
  loadIsuogTopicProgress,
  loadModuleExtraProgress,
  SECTION_TO_ISUOG_TOPIC,
  toggleFetalDopplerSectionDone,
} from "./progress";

export type {
  FetalDopplerSectionId,
  FetalDopplerCase,
  FetalDopplerCaseLevel,
  FetalDopplerEducationalCard,
  FetalDopplerAlgorithm,
  FetalDopplerGlossaryEntry,
} from "./types";

export function fetalDopplerAtlasSrc(filename: string): string {
  return `/images/fetal-doppler/${filename}`;
}
