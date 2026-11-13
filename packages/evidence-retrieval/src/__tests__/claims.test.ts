import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertClaimsConsistent,
  buildRulesClaims,
  normalizeClaims,
  withClaims,
} from "../claims.js";
import { synthesizeEvidenceAnswer } from "../orchestrator.js";
import type { AssistantAnswer, EvidenceRecord, UnifiedSearchResult } from "../types.js";

function record(partial: Partial<EvidenceRecord> & Pick<EvidenceRecord, "id" | "title">): EvidenceRecord {
  return {
    provider: "kr_mz_rf",
    sourceId: partial.id,
    recordType: "guideline",
    url: "https://example.com",
    retrievedAt: new Date().toISOString(),
    relevanceScore: 1,
    ...partial,
  };
}

describe("evidence claims MVP", () => {
  it("builds sourced claims from quotes and marks tips as inference", () => {
    const citations = [
      record({
        id: "a",
        title: "КР",
        section: "O-RADS",
        quote: "O-RADS 3 — наблюдение",
      }),
    ];
    const claims = buildRulesClaims(citations, ["Сверьте с локальным протоколом"]);
    assert.equal(claims[0]?.kind, "sourced");
    assert.deepEqual(claims[0]?.citationIndexes, [0]);
    assert.equal(claims[1]?.kind, "inference");
  });

  it("demotes fake sourced claims without indexes", () => {
    const normalized = normalizeClaims(
      [{ text: "Выдуманный критерий", kind: "sourced", citationIndexes: [] }],
      2,
    );
    assert.equal(normalized[0]?.kind, "inference");
  });

  it("empty search → insufficient, no claims", () => {
    const search: UnifiedSearchResult = {
      query: "zzzz",
      records: [],
      providers: [{ provider: "static_corpus", status: "ok", records: [], latencyMs: 1 }],
      totalBeforeDedup: 0,
      searchedAt: new Date().toISOString(),
    };
    const answer = synthesizeEvidenceAnswer("zzzz", search, { corpusMode: "all" });
    assert.equal(answer.insufficient, true);
    assert.equal(answer.evidenceStrength, "insufficient");
    assert.deepEqual(answer.claims, []);
    assert.equal(assertClaimsConsistent(answer).ok, true);
  });

  it("golden: O-RADS quote yields sourced claim OR would be insufficient without records", () => {
    const search: UnifiedSearchResult = {
      query: "O-RADS 3 наблюдение",
      records: [
        record({
          id: "kr:orads",
          title: "УЗИ в гинекологии",
          year: 2024,
          section: "O-RADS / IOTA — тактика",
          quote: "O-RADS 3: низкий риск — наблюдение по локальному протоколу.",
        }),
      ],
      providers: [{ provider: "kr_mz_rf", status: "ok", records: [], latencyMs: 1 }],
      totalBeforeDedup: 1,
      searchedAt: new Date().toISOString(),
    };
    const answer = synthesizeEvidenceAnswer(search.query, search, { corpusMode: "rf_kr" });
    assert.equal(answer.insufficient, false);
    assert.ok((answer.claims?.length ?? 0) >= 1);
    assert.ok(answer.claims?.some((c) => c.kind === "sourced"));
    assert.equal(assertClaimsConsistent(answer).ok, true);
  });

  it("withClaims clears claims when insufficient", () => {
    const base = {
      query: "q",
      summary: "s",
      evidenceStrength: "insufficient",
      gradeLabel: "нет",
      recommendations: [],
      contraindications: [],
      alternatives: [],
      citations: [],
      guidelines: [],
      disclaimers: [],
      sourcesUsed: {},
      searchedAt: new Date().toISOString(),
      synthesisMode: "rules",
    } satisfies AssistantAnswer;
    const next = withClaims(base, [
      { text: "should drop", kind: "sourced", citationIndexes: [0] },
    ]);
    assert.deepEqual(next.claims, []);
    assert.equal(next.insufficient, true);
  });
});
