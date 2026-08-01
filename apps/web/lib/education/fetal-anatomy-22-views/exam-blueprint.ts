import type { ExamBlueprint } from "@repo/examination-engine";

import { FETAL_ANATOMY_QUIZ_BANK } from "./quiz-bank";

/** ExamEngine blueprint for 22-views module (T2.3). */
export const FETAL_ANATOMY_EXAM_BLUEPRINT: ExamBlueprint = {
  id: "fetal-anatomy-22-views-exam",
  title: "Экзамен · 22 среза II триместра",
  bank: FETAL_ANATOMY_QUIZ_BANK,
  quickCount: 8,
  passingScore: 70,
  timeLimitMin: 25,
  preferImageQuestions: true,
};
