import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuizBank } from "@repo/education-quiz";

import { answerExamQuestion, finishExam, startExam } from "./session";
import type { ExamBlueprint } from "./types";

const bank: QuizBank = {
  topic: "demo",
  version: "1",
  lastReviewed: "2026-08-01",
  sources: [{ id: "s1", title: "S", year: 2024 }],
  questions: [
    {
      id: "q1",
      category: "brain",
      level: "student",
      question: "Image Q?",
      options: ["A", "B"],
      correctIndex: 0,
      explanation: "A",
      sourceId: "s1",
      media: {
        type: "image",
        src: "/images/fetal-anatomy/view-06-transcerebellar_pathology.svg",
        alt: "Banana sign schematic",
      },
    },
    {
      id: "q2",
      category: "heart",
      level: "doctor",
      question: "Text Q?",
      options: ["X", "Y"],
      correctIndex: 1,
      explanation: "Y",
      sourceId: "s1",
    },
  ],
};

const blueprint: ExamBlueprint = {
  id: "demo-exam",
  title: "Demo",
  bank,
  quickCount: 1,
  passingScore: 50,
  preferImageQuestions: true,
};

describe("examination-engine", () => {
  it("prefers image questions in quick mode", () => {
    const session = startExam({
      blueprint,
      mode: "quick",
      seed: 1,
      now: new Date("2026-08-01T10:00:00.000Z"),
    });
    assert.equal(session.questionIds.length, 1);
    assert.equal(session.questionIds[0], "q1");
  });

  it("scores and finishes without revealing mid-exam", () => {
    const started = startExam({
      blueprint: { ...blueprint, quickCount: 2 },
      mode: "quick",
      count: 2,
      seed: 42,
      now: new Date("2026-08-01T10:00:00.000Z"),
    });
    const answered = answerExamQuestion(blueprint, started, 0);
    assert.equal(answered.status, "in_progress");
    assert.equal(Object.keys(answered.selections).length, 1);
    const { session, score } = finishExam(blueprint, answered, new Date("2026-08-01T10:05:00.000Z"));
    assert.equal(session.status, "finished");
    assert.equal(score.total, 2);
    assert.equal(score.answered, 1);
  });
});
