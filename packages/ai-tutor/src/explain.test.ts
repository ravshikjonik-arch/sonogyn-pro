import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRuleFirstExplain, mergeLlmExplain } from "./explain";
import { TutorRequestSchema, TutorResponseSchema } from "./schema";

describe("ai-tutor explain", () => {
  it("builds rule-first explain with whyWrong", () => {
    const response = buildRuleFirstExplain(
      {
        id: "q1",
        stem: "Banana sign — маркер чего?",
        options: ["Isolated VM", "Open spina bifida", "Cleft", "SUA"],
        correctIndex: 1,
        explanation: "Chiari II / open NTD.",
        sourceTitle: "Емельяненко",
        sourceYear: 2026,
        userSelectedIndex: 0,
      },
      "student",
    );
    assert.equal(response.mode, "explain");
    assert.match(response.answer, /Open spina bifida/);
    assert.ok(response.whyWrong?.includes("Isolated VM"));
    assert.equal(response.citations[0]?.title, "Емельяненко");
    assert.equal(TutorResponseSchema.safeParse(response).success, true);
  });

  it("parses request defaults to explain", () => {
    const parsed = TutorRequestSchema.parse({
      question: {
        id: "q1",
        stem: "Demo?",
        options: ["A", "B"],
        correctIndex: 0,
        explanation: "Because A",
      },
    });
    assert.equal(parsed.mode, "explain");
    assert.equal(parsed.level, "student");
    assert.equal(parsed.deepen, false);
  });

  it("mergeLlmExplain switches pipeline", () => {
    const base = buildRuleFirstExplain(
      {
        id: "q1",
        stem: "Q",
        options: ["A", "B"],
        correctIndex: 0,
        explanation: "E",
      },
      "doctor",
    );
    const merged = mergeLlmExplain(base, {
      answer: "Расширенное объяснение",
      keyPoints: ["1", "2"],
      followUpQuestions: ["F?"],
      whyWrong: null,
    });
    assert.equal(merged.meta.pipeline, "llm-explain");
    assert.equal(merged.answer, "Расширенное объяснение");
  });
});
