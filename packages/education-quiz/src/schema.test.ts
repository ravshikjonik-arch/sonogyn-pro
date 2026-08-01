import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { safeParseQuizBank } from "./schema";

describe("QuizBankSchema", () => {
  it("accepts a valid bank", () => {
    const parsed = safeParseQuizBank({
      topic: "demo",
      version: "1.0.0",
      lastReviewed: "2026-08-01",
      sources: [{ id: "s1", title: "Guide", year: 2024 }],
      questions: [
        {
          id: "q1",
          category: "terminology",
          level: "doctor",
          question: "Demo?",
          options: ["A", "B"],
          correctIndex: 0,
          explanation: "Because A",
          sourceId: "s1",
        },
      ],
    });
    assert.equal(parsed.success, true);
  });

  it("rejects unknown sourceId", () => {
    const parsed = safeParseQuizBank({
      topic: "demo",
      version: "1",
      lastReviewed: "2026-08-01",
      sources: [{ id: "s1", title: "Guide", year: 2024 }],
      questions: [
        {
          id: "q1",
          category: "terminology",
          level: "student",
          question: "Demo?",
          options: ["A", "B"],
          correctIndex: 0,
          explanation: "x",
          sourceId: "missing",
        },
      ],
    });
    assert.equal(parsed.success, false);
  });
});
