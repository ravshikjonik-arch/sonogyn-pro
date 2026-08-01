import type { QuizProgress, QuizQuestion } from "@repo/education-quiz";

import type { ExamScore, ExamSelection, ExamSession } from "./types";

export function gradeSelection(question: QuizQuestion, selectedIndex: number): ExamSelection {
  return {
    selectedIndex,
    isCorrect: selectedIndex === question.correctIndex,
  };
}

export function selectionsToProgress(selections: Record<string, ExamSelection>): QuizProgress {
  const progress: QuizProgress = {};
  for (const [id, selection] of Object.entries(selections)) {
    progress[id] = selection.isCorrect ? "correct" : "incorrect";
  }
  return progress;
}

export function scoreExamSession(
  session: ExamSession,
  passingScore: number,
): ExamScore {
  const total = session.questionIds.length;
  let correct = 0;
  let incorrect = 0;
  for (const id of session.questionIds) {
    const selection = session.selections[id];
    if (!selection) continue;
    if (selection.isCorrect) correct += 1;
    else incorrect += 1;
  }
  const answered = correct + incorrect;
  const unanswered = total - answered;
  const percentCorrect = total ? Math.round((correct / total) * 100) : 0;
  return {
    total,
    answered,
    correct,
    incorrect,
    unanswered,
    percentCorrect,
    passed: percentCorrect >= passingScore,
    progress: selectionsToProgress(session.selections),
  };
}
