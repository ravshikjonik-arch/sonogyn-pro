import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { dedupeEvidenceRecords } from "../dedup.js";
import type { EvidenceRecord } from "../types.js";

function rec(partial: Partial<EvidenceRecord> & Pick<EvidenceRecord, "id" | "provider" | "sourceId" | "title" | "url">): EvidenceRecord {
  return {
    recordType: "review",
    retrievedAt: new Date().toISOString(),
    relevanceScore: 0.5,
    ...partial,
  };
}

describe("dedupeEvidenceRecords", () => {
  it("merges by PMID", () => {
    const a = rec({
      id: "pubmed:123",
      provider: "pubmed",
      sourceId: "123",
      title: "NT measurement in first trimester",
      pmid: "123",
      url: "https://pubmed.ncbi.nlm.nih.gov/123/",
      abstract: "Long abstract",
    });
    const b = rec({
      id: "europe_pmc:123",
      provider: "europe_pmc",
      sourceId: "123",
      title: "NT measurement in first trimester",
      pmid: "123",
      url: "https://europepmc.org/123",
    });

    const out = dedupeEvidenceRecords([a, b]);
    assert.equal(out.length, 1);
    assert.ok(out[0]?.abstract);
  });

  it("merges by DOI", () => {
    const a = rec({
      id: "pubmed:1",
      provider: "pubmed",
      sourceId: "1",
      title: "Study A",
      doi: "10.1000/xyz",
      url: "https://example.com/a",
    });
    const b = rec({
      id: "semantic_scholar:abc",
      provider: "semantic_scholar",
      sourceId: "abc",
      title: "Study A",
      doi: "10.1000/xyz",
      url: "https://example.com/b",
    });
    assert.equal(dedupeEvidenceRecords([a, b]).length, 1);
  });
});
