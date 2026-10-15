import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AssistantAnswer } from "@repo/evidence-retrieval";

import {
  buildEvidenceModeSystemPrompt,
  classificationVersionHintsForQuery,
  formatEvidenceContextForPrompt,
} from "./evidence-context";

const emptyAnswer: AssistantAnswer = {
  query: "test",
  summary: "Nothing found",
  evidenceStrength: "insufficient",
  gradeLabel: "Недостаточно данных",
  recommendations: [],
  contraindications: [],
  alternatives: [],
  citations: [],
  guidelines: [],
  disclaimers: ["CDS"],
  sourcesUsed: {},
  searchedAt: new Date().toISOString(),
  synthesisMode: "rules",
};

describe("evidence-context", () => {
  it("flags empty citations in prompt context", () => {
    const ctx = formatEvidenceContextForPrompt(emptyAnswer);
    assert.match(ctx, /NONE/i);
    assert.match(ctx, /NOT provide clinical recommendations/i);
  });

  it("adds O-RADS version hint for orads query", () => {
    const hints = classificationVersionHintsForQuery("киста яичника O-RADS 4");
    assert.ok(hints.some((h) => h.includes("v2022")));
    const prompt = buildEvidenceModeSystemPrompt("ctx", "O-RADS 4");
    assert.match(prompt, /v2022/);
  });
});
