import type { QuizQuestion } from "@repo/education-quiz";

import { gradeSelection, scoreExamSession } from "./score";
import { defaultQuestionCount, filterQuestionsForExam, pickExamQuestions } from "./select";
import type { ExamBlueprint, ExamScore, ExamSession, StartExamInput } from "./types";

function resolveQuestions(blueprint: ExamBlueprint, session: ExamSession): QuizQuestion[] {
  const byId = new Map(blueprint.bank.questions.map((q) => [q.id, q]));
  return session.questionIds.map((id) => byId.get(id)).filter((q): q is QuizQuestion => Boolean(q));
}

export function startExam(input: StartExamInput): ExamSession {
  const now = input.now ?? new Date();
  const level = input.level ?? "all";
  const pool = filterQuestionsForExam(
    input.blueprint.bank.questions,
    level,
    Boolean(input.blueprint.preferImageQuestions),
  );
  const count = defaultQuestionCount(
    input.mode,
    pool.length,
    input.blueprint.quickCount,
    input.count,
  );
  const seed = input.seed ?? (now.getTime() % 2_147_483_647);
  const picked = pickExamQuestions(
    pool,
    count,
    seed,
    Boolean(input.blueprint.preferImageQuestions),
  );

  const timeLimitMin =
    input.mode === "quick" ? undefined : input.blueprint.timeLimitMin;
  const endsAt =
    timeLimitMin && timeLimitMin > 0
      ? new Date(now.getTime() + timeLimitMin * 60_000).toISOString()
      : null;

  return {
    blueprintId: input.blueprint.id,
    mode: input.mode,
    level,
    status: "in_progress",
    questionIds: picked.map((q) => q.id),
    selections: {},
    startedAt: now.toISOString(),
    finishedAt: null,
    endsAt,
    currentIndex: 0,
  };
}

export function getCurrentQuestion(
  blueprint: ExamBlueprint,
  session: ExamSession,
): QuizQuestion | null {
  const id = session.questionIds[session.currentIndex];
  if (!id) return null;
  return blueprint.bank.questions.find((q) => q.id === id) ?? null;
}

export function answerExamQuestion(
  blueprint: ExamBlueprint,
  session: ExamSession,
  selectedIndex: number,
  now: Date = new Date(),
): ExamSession {
  if (session.status !== "in_progress") return session;
  if (session.endsAt && now.toISOString() > session.endsAt) {
    return finishExam(blueprint, session, now).session;
  }
  const question = getCurrentQuestion(blueprint, session);
  if (!question) return session;
  if (session.selections[question.id]) return session;

  return {
    ...session,
    selections: {
      ...session.selections,
      [question.id]: gradeSelection(question, selectedIndex),
    },
  };
}

export function goToExamQuestion(session: ExamSession, index: number): ExamSession {
  if (session.status !== "in_progress") return session;
  if (index < 0 || index >= session.questionIds.length) return session;
  return { ...session, currentIndex: index };
}

export function finishExam(
  blueprint: ExamBlueprint,
  session: ExamSession,
  now: Date = new Date(),
): { session: ExamSession; score: ExamScore } {
  const finished: ExamSession = {
    ...session,
    status: "finished",
    finishedAt: now.toISOString(),
  };
  return {
    session: finished,
    score: scoreExamSession(finished, blueprint.passingScore),
  };
}

export function isExamTimedOut(session: ExamSession, now: Date = new Date()): boolean {
  return Boolean(session.endsAt && now.toISOString() > session.endsAt);
}

export function listExamQuestions(blueprint: ExamBlueprint, session: ExamSession): QuizQuestion[] {
  return resolveQuestions(blueprint, session);
}
