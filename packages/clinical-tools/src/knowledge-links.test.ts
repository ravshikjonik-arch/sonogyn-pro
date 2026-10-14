import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getKnowledgeLinksForNosology, listNosologyIdsWithKnowledgeLinks } from "./knowledge-links";

describe("knowledge-links", () => {
  it("returns O-RADS links for endometrioma", () => {
    const links = getKnowledgeLinksForNosology("endometrioma");
    assert.ok(links.some((l) => l.href.includes("o-rads")));
  });

  it("lists seeded nosology ids", () => {
    assert.ok(listNosologyIdsWithKnowledgeLinks().includes("uterine-myoma"));
  });
});
