import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evidenceCostModelLabel, expectedEvidenceLlmCalls } from "../evidence-cost";

describe("evidence-cost", () => {
  it("single-pass rules → 0 LLM", () => {
    assert.equal(
      expectedEvidenceLlmCalls({
        insufficient: false,
        singlePass: true,
        synthesisMode: "rules",
      }),
      0,
    );
  });

  it("single-pass llm synthesis → 1 LLM", () => {
    assert.equal(
      expectedEvidenceLlmCalls({
        insufficient: false,
        singlePass: true,
        synthesisMode: "llm",
      }),
      1,
    );
  });

  it("dual with llm synth → 2 LLM", () => {
    assert.equal(
      expectedEvidenceLlmCalls({
        insufficient: false,
        singlePass: false,
        synthesisMode: "llm",
      }),
      2,
    );
  });

  it("insufficient → 0", () => {
    assert.equal(
      expectedEvidenceLlmCalls({
        insufficient: true,
        singlePass: true,
        synthesisMode: "llm",
      }),
      0,
    );
  });

  it("model label encodes meter", () => {
    assert.equal(
      evidenceCostModelLabel({
        llmCalls: 1,
        singlePass: true,
        synthesisMode: "llm",
      }),
      "evidence:single-pass:llmCalls=1:llm",
    );
  });
});
