import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { evidenceStrengthFromRecords, rankEvidenceRecords } from "../ranker.js";
import type { EvidenceRecord } from "../types.js";

function rec(type: EvidenceRecord["recordType"], year: number, score = 0.5): EvidenceRecord {
  return {
    id: `test:${type}:${year}`,
    provider: "pubmed",
    sourceId: `${type}-${year}`,
    recordType: type,
    title: `${type} study ${year}`,
    url: "https://example.com",
    year,
    retrievedAt: new Date().toISOString(),
    relevanceScore: score,
  };
}

describe("rankEvidenceRecords", () => {
  it("prefers systematic reviews", () => {
    const ranked = rankEvidenceRecords([rec("cohort", 2020), rec("systematic_review", 2019)], {
      preferHighEvidence: true,
    });
    assert.equal(ranked[0]?.recordType, "systematic_review");
  });
});

describe("evidenceStrengthFromRecords", () => {
  it("returns high when meta + guideline present", () => {
    const { strength } = evidenceStrengthFromRecords([
      rec("systematic_review", 2023),
      rec("guideline", 2024),
    ]);
    assert.equal(strength, "high");
  });
});
