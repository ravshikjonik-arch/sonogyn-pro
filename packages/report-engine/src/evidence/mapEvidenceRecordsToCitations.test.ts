import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAdnexReportCitations } from "../adnex/citations.js";
import {
  mapEvidenceRecordsToReportCitations,
  mergeReportCitations,
} from "./mapEvidenceRecordsToCitations.js";

describe("mapEvidenceRecordsToReportCitations", () => {
  it("maps provider labels and quotes", () => {
    const out = mapEvidenceRecordsToReportCitations([
      {
        id: "pubmed:123",
        provider: "pubmed",
        title: "NT screening meta-analysis",
        url: "https://pubmed.ncbi.nlm.nih.gov/123/",
        year: 2022,
        abstract: "Systematic review of first trimester screening.",
      },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.standard, "PubMed");
    assert.equal(out[0]?.version, "2022");
    assert.match(out[0]?.quote ?? "", /Systematic review/);
  });
});

describe("mergeReportCitations", () => {
  it("dedupes by url", () => {
    const primary = buildAdnexReportCitations();
    const evidence = mapEvidenceRecordsToReportCitations([
      {
        id: "static:1",
        provider: "static_corpus",
        title: "O-RADS evidence",
        url: "https://example.com/a",
      },
      {
        id: "static:2",
        provider: "static_corpus",
        title: "Other",
        url: "https://example.com/b",
      },
    ]);
    const merged = mergeReportCitations(primary, evidence, 30);
    assert.ok(merged.length >= primary.length);
  });
});
