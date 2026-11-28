import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { BrainTurn } from "@repo/medical-calculations";

import {
  inferCorpusMode,
  shouldAttachRegistryHints,
  shouldEnrichWithEvidence,
} from "./orchestrator";

function turn(partial: Partial<BrainTurn> & Pick<BrainTurn, "intent" | "reply">): BrainTurn {
  return {
    session: {},
    contract: {
      intent: partial.intent,
      citations: [],
      disclaimer: "тест",
      ...partial.contract,
    },
    ...partial,
  } as BrainTurn;
}

describe("clinical-copilot orchestrator", () => {
  it("inferCorpusMode picks rf_kr for Russian KR queries", () => {
    assert.equal(inferCorpusMode("клиническая рекомендация МЗ РФ по миоме"), "rf_kr");
  });

  it("shouldEnrichWithEvidence is false for successful calculate", () => {
    const t = turn({
      intent: "calculate",
      reply: "ok",
      contract: { result: { nt_mm: 1.8 }, missingSlots: [] },
    });
    assert.equal(shouldEnrichWithEvidence(t, "NT 1.8", true), false);
  });

  it("shouldEnrichWithEvidence is true for lookup_kr", () => {
    const t = turn({ intent: "lookup_kr", reply: "ok" });
    assert.equal(shouldEnrichWithEvidence(t, "порог NT 3.5", true), true);
  });

  it("shouldEnrichWithEvidence is true for guideline-like free text", () => {
    const t = turn({ intent: "explain_term", reply: "ok" });
    assert.equal(shouldEnrichWithEvidence(t, "тактика по FMF consensus", true), true);
  });

  it("shouldAttachRegistryHints for successful calculate with FIGO mention", () => {
    const t = turn({
      intent: "calculate",
      reply: "ok",
      contract: { result: { ga_weeks: 12 } },
    });
    assert.equal(shouldEnrichWithEvidence(t, "КТР 63 миома FIGO", true), false);
    assert.equal(shouldAttachRegistryHints(t, "КТР 63 миома FIGO", true), true);
  });
});