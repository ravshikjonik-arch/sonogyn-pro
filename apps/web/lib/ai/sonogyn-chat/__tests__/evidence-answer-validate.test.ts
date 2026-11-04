import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AssistantAnswer } from "@repo/evidence-retrieval";

import {
  formatEvidenceSourcedChatReply,
  postValidateEvidenceAnswer,
} from "../evidence-answer-validate";

function baseAnswer(over: Partial<AssistantAnswer> = {}): AssistantAnswer {
  return {
    query: "O-RADS",
    summary: "По данным источников тактика зависит от категории.",
    evidenceStrength: "moderate",
    gradeLabel: "умеренная",
    recommendations: ["Следовать ACR O-RADS US v2022"],
    contraindications: [],
    alternatives: [],
    citations: [
      {
        id: "c1",
        title: "ACR O-RADS US",
        url: "https://example.org/orads",
        provider: "guideline",
        year: 2022,
        abstract: "Reporting system",
      } as AssistantAnswer["citations"][0],
    ],
    guidelines: [{ title: "ACR O-RADS", url: "https://example.org/orads", org: "ACR" }],
    disclaimers: ["CDS, не диагноз"],
    sourcesUsed: {},
    searchedAt: new Date().toISOString(),
    synthesisMode: "rules",
    ...over,
  };
}

describe("postValidateEvidenceAnswer", () => {
  it("empty citations → reject invented markers", () => {
    const answer = baseAnswer({
      citations: [],
      evidenceStrength: "insufficient",
      summary: "Нет данных",
    });
    const r = postValidateEvidenceAnswer("См. [1] PMID 99999999", answer);
    assert.equal(r.ok, false);
    assert.equal(r.replaced, true);
    assert.ok(r.reasons.some((x) => x.includes("citations_without_retrieval") || x.includes("pmid")));
  });

  it("valid [1] and whitelist URL → ok", () => {
    const answer = baseAnswer();
    const text = formatEvidenceSourcedChatReply(answer);
    const r = postValidateEvidenceAnswer(text, answer);
    assert.equal(r.ok, true);
    assert.equal(r.replaced, false);
    assert.match(r.text, /\[1\]/);
  });

  it("invented PMID → replace", () => {
    const answer = baseAnswer();
    const r = postValidateEvidenceAnswer(
      "Рекомендуется наблюдение [1]. PMID 99999999 https://evil.example/x",
      answer,
    );
    assert.equal(r.ok, false);
    assert.equal(r.replaced, true);
    assert.ok(r.reasons.some((x) => x.startsWith("invented_pmid")));
  });

  it("URL outside whitelist → replace", () => {
    const answer = baseAnswer();
    const r = postValidateEvidenceAnswer(
      "См. [1] и https://random-hallucinated.org/paper",
      answer,
    );
    assert.equal(r.ok, false);
    assert.ok(r.reasons.some((x) => x.startsWith("url_not_in_whitelist")));
  });

  it("missing citation markers without source block → replace", () => {
    const answer = baseAnswer();
    const r = postValidateEvidenceAnswer("Просто текст без ссылок и PMID.", answer);
    assert.equal(r.ok, false);
    assert.ok(r.reasons.includes("missing_citation_markers"));
  });

  it("provider switch does not change validation of same text", () => {
    const answer = baseAnswer();
    const text = formatEvidenceSourcedChatReply(answer);
    const a = postValidateEvidenceAnswer(text, answer);
    const b = postValidateEvidenceAnswer(text, answer);
    assert.deepEqual(a, b);
  });
});
