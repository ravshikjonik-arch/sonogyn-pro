import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildEvidenceRecord, inferRecordType } from "../normalizer.js";

describe("normalizer", () => {
  it("infers systematic review from Cochrane provider", () => {
    assert.equal(
      inferRecordType({ provider: "cochrane", title: "Antibiotics for chronic prostatitis" }),
      "systematic_review",
    );
  });

  it("builds stable record id", () => {
    const r = buildEvidenceRecord({
      provider: "pubmed",
      sourceId: "999",
      title: "Test",
      url: "https://pubmed.ncbi.nlm.nih.gov/999/",
    });
    assert.equal(r.id, "pubmed:999");
    assert.equal(r.pmid, "999");
  });
});
