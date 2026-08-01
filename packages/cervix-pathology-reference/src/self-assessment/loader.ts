import {
  assertQuizBankInDev,
  filterQuizQuestionsByLevel,
  quizProgressPercent as sharedQuizProgressPercent,
  resolveQuizSource as sharedResolveQuizSource,
  type QuizBank,
  type QuizLevel,
  type QuizProgress,
  type QuizQuestion,
  type QuizSource,
} from "@repo/education-quiz";

import quizBankData from "../../self-assessment/data/quiz-bank.json";

const bank = assertQuizBankInDev(quizBankData as QuizBank, "cervix-quiz");

export function getQuizBank(): QuizBank {
  return bank;
}

export function getQuizQuestionsByLevel(level: QuizLevel | "all"): QuizQuestion[] {
  return filterQuizQuestionsByLevel(bank.questions, level);
}

export function resolveQuizSource(sourceId: string): QuizSource | undefined {
  return sharedResolveQuizSource(bank, sourceId);
}

export function quizProgressPercent(
  progress: QuizProgress | Record<string, unknown>,
  questionIds: string[],
): number {
  return sharedQuizProgressPercent(progress as QuizProgress, questionIds);
}
