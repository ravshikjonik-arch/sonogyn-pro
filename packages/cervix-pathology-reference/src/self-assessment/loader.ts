import quizBankData from "../../self-assessment/data/quiz-bank.json";

import type { QuizBank, QuizLevel, QuizQuestion, QuizSource } from "./types";

const bank = quizBankData as QuizBank;

if (process.env.NODE_ENV !== "production") {
  for (const q of bank.questions) {
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      console.warn(`[cervix-quiz] invalid correctIndex for ${q.id}`);
    }
    if (!bank.sources.some((s) => s.id === q.sourceId)) {
      console.warn(`[cervix-quiz] missing sourceId ${q.sourceId} for ${q.id}`);
    }
  }
}

export function getQuizBank(): QuizBank {
  return bank;
}

export function getQuizQuestionsByLevel(level: QuizLevel | "all"): QuizQuestion[] {
  if (level === "all") return bank.questions;
  return bank.questions.filter((q) => q.level === level);
}

export function resolveQuizSource(sourceId: string): QuizSource | undefined {
  return bank.sources.find((s) => s.id === sourceId);
}

export function quizProgressPercent(progress: Record<string, unknown>, questionIds: string[]): number {
  if (!questionIds.length) return 0;
  const answered = questionIds.filter((id) => progress[id] != null).length;
  return Math.round((answered / questionIds.length) * 100);
}
