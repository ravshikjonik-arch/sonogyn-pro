/** Shared quiz-bank contract for self-assessment modules (web + mobile). */

export type QuizLevel = "doctor" | "student";

export type QuizSource = {
  id: string;
  title: string;
  year: number;
  status?: string;
};

/** Optional stem media (T2.3 image-MCQ). Absolute site path or https URL. */
export type QuizQuestionMedia = {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
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
  /** Optional image for image-MCQ (ExamEngine / self-assessment). */
  media?: QuizQuestionMedia;
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
