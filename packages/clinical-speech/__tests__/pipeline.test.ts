import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { postProcessDictation } from "../src/postprocess/pipeline";

describe("postProcessDictation", () => {
  it("normalizes O-RADS spoken form", () => {
    const r = postProcessDictation("о радс 4");
    assert.match(r.text, /O-RADS/i);
  });

  it("honors clear command before glossary", () => {
    const r = postProcessDictation("очистить поле");
    assert.equal(r.text, "");
    assert.equal(r.sideEffect, "clear");
  });
});
