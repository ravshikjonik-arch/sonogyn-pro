import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildTutorQuizExam, TutorQuizExamRequestSchema } from "./quiz-exam";

describe("ai-tutor quiz/exam", () => {
  it("builds quiz session from bank", () => {
    const req = TutorQuizExamRequestSchema.parse({
      mode: "quiz",
      level: "student",
      topic: "demo",
      count: 2,
      questions: [
        {
          id: "q1",
          stem: "A?",
          options: ["1", "2"],
          correctIndex: 0,
          explanation: "e1",
          level: "student",
        },
        {
          id: "q2",
          stem: "B?",
          options: ["1", "2"],
          correctIndex: 1,
          explanation: "e2",
          level: "doctor",
        },
        {
          id: "q3",
          stem: "C?",
          options: ["1", "2"],
          correctIndex: 0,
          explanation: "e3",
          level: "student",
        },
      ],
    });
    const session = buildTutorQuizExam(req);
    assert.equal(session.mode, "quiz");
    assert.equal(session.questions.length, 2);
    assert.equal(session.timeLimitMin, null);
    assert.ok(session.questions.every((q) => q.id === "q1" || q.id === "q3"));
  });

  it("exam mode sets timer", () => {
    const session = buildTutorQuizExam({
      mode: "exam",
      level: "doctor",
      count: 1,
      questions: [
        {
          id: "q1",
          stem: "A?",
          options: ["1", "2"],
          correctIndex: 0,
          explanation: "e",
          level: "doctor",
        },
      ],
      locale: "ru",
    });
    assert.equal(session.mode, "exam");
    assert.ok((session.timeLimitMin ?? 0) >= 10);
    assert.equal(session.passingScore, 70);
  });
});
