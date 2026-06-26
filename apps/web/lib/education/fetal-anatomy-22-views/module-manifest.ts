import {
  FETAL_ANATOMY_ANOMALIES,
  FETAL_ANATOMY_ANOMALY_COUNT,
} from "./anomalies";
import { FETAL_ANATOMY_SURVEY_ALGORITHM, FETAL_ANATOMY_INTRODUCTION } from "./algorithms";
import { FETAL_ANATOMY_CASES } from "./cases";
import {
  FETAL_ANATOMY_DISCLAIMER,
  FETAL_ANATOMY_MODULE_ID,
  FETAL_ANATOMY_MODULE_TITLE,
  FETAL_ANATOMY_MODULE_TITLE_RU,
  FETAL_ANATOMY_SOURCE,
} from "./constants";
import { FETAL_ANATOMY_GLOSSARY } from "./glossary";
import { FETAL_ANATOMY_KNOWLEDGE_BASE } from "./knowledge-base";
import { FETAL_ANATOMY_CORE_TOPIC_IDS, ISUOG_TOPIC_TO_VIEW_IDS } from "./progress";
import { FETAL_ANATOMY_QUIZ_BANK, FETAL_ANATOMY_ORAL_QUESTIONS } from "./quiz-bank";
import { FETAL_ANATOMY_VIEWS, FETAL_ANATOMY_VIEW_COUNT } from "./views";

/** Machine-readable manifest for integrations / export. */
export const FETAL_ANATOMY_MODULE_MANIFEST = {
  id: FETAL_ANATOMY_MODULE_ID,
  title: FETAL_ANATOMY_MODULE_TITLE,
  titleRu: FETAL_ANATOMY_MODULE_TITLE_RU,
  disclaimer: FETAL_ANATOMY_DISCLAIMER,
  source: FETAL_ANATOMY_SOURCE,
  route: "/tools/refs/fetal-anatomy-22-views",
  isuogLectureId: "lecture-8-fetal-anatomy-22-views",
  counts: {
    views: FETAL_ANATOMY_VIEW_COUNT,
    anomalies: FETAL_ANATOMY_ANOMALY_COUNT,
    cases: FETAL_ANATOMY_CASES.length,
    quizQuestions: FETAL_ANATOMY_QUIZ_BANK.questions.length,
    oralQuestions: FETAL_ANATOMY_ORAL_QUESTIONS.length,
    glossaryTerms: FETAL_ANATOMY_GLOSSARY.length,
    isuogTopics: FETAL_ANATOMY_CORE_TOPIC_IDS.length,
  },
  isuogTopicToViews: ISUOG_TOPIC_TO_VIEW_IDS,
  algorithm: FETAL_ANATOMY_SURVEY_ALGORITHM,
  introduction: FETAL_ANATOMY_INTRODUCTION,
  version: "1.1.0",
  lastReviewed: "2026-06-20",
} as const;

/** Full JSON-serializable knowledge export for assistant / search indexing. */
export function buildFetalAnatomyKnowledgeJson() {
  return {
    manifest: FETAL_ANATOMY_MODULE_MANIFEST,
    views: FETAL_ANATOMY_VIEWS.map((v) => ({
      id: v.id,
      number: v.number,
      region: v.region,
      title: v.title,
      titleRu: v.titleRu,
      plane: v.plane,
      excludesAnomalyIds: v.excludesAnomalyIds,
      atlasNormal: v.atlasNormal,
      atlasPathology: v.atlasPathology,
    })),
    anomalies: FETAL_ANATOMY_ANOMALIES,
    cases: FETAL_ANATOMY_CASES,
    glossary: FETAL_ANATOMY_GLOSSARY,
    knowledgeBase: FETAL_ANATOMY_KNOWLEDGE_BASE,
    quiz: FETAL_ANATOMY_QUIZ_BANK,
    oralQuestions: [...FETAL_ANATOMY_ORAL_QUESTIONS],
  };
}
