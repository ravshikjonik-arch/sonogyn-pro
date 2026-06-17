import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPubmedQueryFromNosology, pubmedArticleUrl, pubmedSearchUrl } from "./pubmed";

describe("pubmed helpers", () => {
  it("builds article url", () => {
    assert.equal(pubmedArticleUrl("35276085"), "https://pubmed.ncbi.nlm.nih.gov/35276085/");
  });

  it("builds search url with filters", () => {
    const url = pubmedSearchUrl("O-RADS ultrasound", { years: "2015:2026", publicationTypes: ["review"] });
    assert.ok(url.includes("pubmed.ncbi.nlm.nih.gov"));
    assert.ok(url.includes("O-RADS"));
    assert.ok(url.includes("filter"));
  });

  it("uses custom pubmedQuery when set", () => {
    const q = buildPubmedQueryFromNosology({
      title: "Миома",
      keywords: ["FIGO"],
      zone: "uterus",
      pubmedQuery: "uterine fibroid ultrasound FIGO",
    });
    assert.equal(q, "uterine fibroid ultrasound FIGO");
  });
});
