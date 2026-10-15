import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { searchGlobalLocal } from "./global-search";

describe("searchGlobalLocal", () => {
  it("finds O-RADS in tools and classifications for query orads", () => {
    const r = searchGlobalLocal("orads");
    assert.ok(r.tools.some((t) => t.title.toLowerCase().includes("o-rads") || t.id.includes("orads")));
    assert.ok(r.classifications.some((c) => c.system === "O-RADS"));
  });

  it("returns guideline hits for миома", () => {
    const r = searchGlobalLocal("миома");
    assert.ok(r.guidelines.length >= 1 || r.nosologies.length >= 1);
  });

  it("returns education modules when empty query", () => {
    const r = searchGlobalLocal("");
    assert.ok(r.education.length >= 1);
    assert.ok(r.quizzes.length >= 1);
  });
});
