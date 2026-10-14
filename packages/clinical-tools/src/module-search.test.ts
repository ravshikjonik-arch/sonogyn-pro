import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { searchEducationModules, searchModules } from "./module-search";

describe("module-search", () => {
  it("finds o-rads module", () => {
    const hits = searchModules("o-rads", 5);
    assert.ok(hits.some((h) => h.id.includes("o-rads") || h.title.toLowerCase().includes("o-rads")));
  });

  it("lists education modules on empty query", () => {
    const hits = searchEducationModules("", 3);
    assert.ok(hits.length >= 1);
  });
});
