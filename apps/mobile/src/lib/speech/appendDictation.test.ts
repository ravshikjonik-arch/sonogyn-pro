import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { appendDictationText } from "./appendDictation";

describe("appendDictationText", () => {
  it("merges with postprocess glossary", () => {
    const out = appendDictationText("", "о радс 4");
    assert.match(out, /O-RADS/i);
  });

  it("clears on voice command", () => {
    assert.equal(appendDictationText("старый текст", "очистить"), "");
  });
});
