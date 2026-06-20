/** Общий контракт quiz-bank.json для self-assessment модулей (cervix, vascular, breast). */

export type QuizLevel = "doctor" | "student";

export type QuizSource = {
  id: string;
  title: string;
  year: number;
  status?: string;
};

export type QuizQuestion = {
  id: string;
  category: string;
  level: QuizLevel;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceId: string;
};

export type QuizBank = {
  topic: string;
  version: string;
  lastReviewed: string;
  sources: QuizSource[];
  questions: QuizQuestion[];
};

export type QuizAnswerRecord = "correct" | "incorrect";

export type QuizProgress = Record<string, QuizAnswerRecord>;

export type QuizReviewMode = "all" | "mistakes" | "new";

export type QuizProgressStats = {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  percentAnswered: number;
  percentCorrect: number;
};

export const QUIZ_CATEGORY_LABELS: Record<string, string> = {
  terminology: "Терминология",
  management: "Ведение",
  staging: "Стадирование",
  screening: "Скрининг",
  "follow-up": "Наблюдение",
  epidemiology: "Эпидемиология",
  diagnostics: "Диагностика",
};

export function resolveQuizSource(bank: QuizBank, sourceId: string): QuizSource | undefined {
  return bank.sources.find((s) => s.id === sourceId);
}

export function quizProgressPercent(progress: QuizProgress, questionIds: string[]): number {
  if (!questionIds.length) return 0;
  const answered = questionIds.filter((id) => progress[id] != null).length;
  return Math.round((answered / questionIds.length) * 100);
}

export function quizProgressStats(progress: QuizProgress, questionIds: string[]): QuizProgressStats {
  const total = questionIds.length;
  let answered = 0;
  let correct = 0;
  let incorrect = 0;
  for (const id of questionIds) {
    const record = progress[id];
    if (record == null) continue;
    answered += 1;
    if (record === "correct") correct += 1;
    else incorrect += 1;
  }
  return {
    total,
    answered,
    correct,
    incorrect,
    percentAnswered: total ? Math.round((answered / total) * 100) : 0,
    percentCorrect: answered ? Math.round((correct / answered) * 100) : 0,
  };
}

export function filterQuizQuestions(
  questions: QuizQuestion[],
  progress: QuizProgress,
  mode: QuizReviewMode,
): QuizQuestion[] {
  if (mode === "all") return questions;
  if (mode === "mistakes") return questions.filter((q) => progress[q.id] === "incorrect");
  return questions.filter((q) => progress[q.id] == null);
}

export function formatQuizCategory(category: string, labels: Record<string, string> = QUIZ_CATEGORY_LABELS): string {
  return labels[category] ?? category;
}
