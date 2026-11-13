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

  it("boosts medical_vault over same-score pubmed other, but not over kr_mz_rf guideline", () => {
    const vault: EvidenceRecord = {
      ...rec("other", 2024, 0.7),
      id: "vault:1",
      provider: "medical_vault",
      sourceId: "vault-1",
      title: "Vault chunk",
    };
    const pubmedOther = rec("other", 2024, 0.7);
    const kr: EvidenceRecord = {
      ...rec("guideline", 2024, 0.7),
      id: "kr:1",
      provider: "kr_mz_rf",
      sourceId: "kr-1",
      title: "КР МЗ РФ",
    };

    const vsPubmed = rankEvidenceRecords([pubmedOther, vault], { preferHighEvidence: false });
    assert.equal(vsPubmed[0]?.provider, "medical_vault");

    const vsKr = rankEvidenceRecords([vault, kr], { preferHighEvidence: true });
    assert.equal(vsKr[0]?.provider, "kr_mz_rf");
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
