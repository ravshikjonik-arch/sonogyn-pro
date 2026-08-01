import type { ExamAttemptMode, QuizBank, QuizLevel, QuizProgress, QuizQuestion } from "@repo/education-quiz";

export type ExamMode = Extract<ExamAttemptMode, "quick" | "certification" | "mock">;

export type ExamBlueprint = {
  id: string;
  title: string;
  bank: QuizBank;
  /** Default question count for quick mode. */
  quickCount: number;
  /** Passing score percent (0–100). */
  passingScore: number;
  /** Optional timer for certification/mock (minutes). */
  timeLimitMin?: number;
  /** Prefer questions that have media when available. */
  preferImageQuestions?: boolean;
};

export type ExamSessionStatus = "ready" | "in_progress" | "finished";

export type ExamSelection = {
  selectedIndex: number;
  isCorrect: boolean;
};

export type ExamSession = {
  blueprintId: string;
  mode: ExamMode;
  level: QuizLevel | "all";
  status: ExamSessionStatus;
  questionIds: string[];
  /** questionId → selection */
  selections: Record<string, ExamSelection>;
  startedAt: string | null;
  finishedAt: string | null;
  endsAt: string | null;
  currentIndex: number;
};

export type ExamScore = {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentCorrect: number;
  passed: boolean;
  progress: QuizProgress;
};

export type StartExamInput = {
  blueprint: ExamBlueprint;
  mode: ExamMode;
  level?: QuizLevel | "all";
  /** Override question count (quick/mock). */
  count?: number;
  /** Seed for deterministic shuffle (tests / resume). */
  seed?: number;
  now?: Date;
};

export type { QuizQuestion, QuizBank, QuizLevel, QuizProgress };
