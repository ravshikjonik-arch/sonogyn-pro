import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterQuizQuestions,
  filterQuizQuestionsByLevel,
  mergeQuizProgress,
  quizProgressPercent,
  quizProgressStats,
  resolveQuizSource,
} from "./helpers";
import type { QuizBank, QuizQuestion } from "./types";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    category: "terminology",
    level: "doctor",
    question: "A?",
    options: ["1", "2"],
    correctIndex: 0,
    explanation: "e",
    sourceId: "s1",
  },
  {
    id: "q2",
    category: "screening",
    level: "student",
    question: "B?",
    options: ["1", "2"],
    correctIndex: 1,
    explanation: "e",
    sourceId: "s1",
  },
];

const bank: QuizBank = {
  topic: "test",
  version: "1",
  lastReviewed: "2026-08-01",
  sources: [{ id: "s1", title: "Source", year: 2024 }],
  questions,
};

describe("education-quiz helpers", () => {
  it("resolveQuizSource", () => {
    assert.equal(resolveQuizSource(bank, "s1")?.title, "Source");
    assert.equal(resolveQuizSource(bank, "missing"), undefined);
  });

  it("quizProgressPercent / stats", () => {
    const progress = { q1: "correct" as const, q2: "incorrect" as const };
    assert.equal(quizProgressPercent(progress, ["q1", "q2"]), 100);
    const stats = quizProgressStats(progress, ["q1", "q2"]);
    assert.equal(stats.correct, 1);
    assert.equal(stats.incorrect, 1);
    assert.equal(stats.percentCorrect, 50);
  });

  it("filter modes and levels", () => {
    const progress = { q1: "incorrect" as const };
    assert.equal(filterQuizQuestions(questions, progress, "mistakes").length, 1);
    assert.equal(filterQuizQuestions(questions, progress, "new")[0]?.id, "q2");
    assert.equal(filterQuizQuestionsByLevel(questions, "student").length, 1);
  });

  it("mergeQuizProgress prefers correct", () => {
    const merged = mergeQuizProgress(
      { q1: "incorrect", q2: "correct" },
      { q1: "correct", q3: "incorrect" },
    );
    assert.equal(merged.q1, "correct");
    assert.equal(merged.q2, "correct");
    assert.equal(merged.q3, "incorrect");
  });
});
