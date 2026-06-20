/** Схема quiz-bank.json — зеркало `apps/web/lib/education/quiz-bank-types.ts`. */

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
