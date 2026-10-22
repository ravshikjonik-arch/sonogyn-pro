import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseVoiceProtocol } from "./voice-protocol-nlp";

describe("parseVoiceProtocol", () => {
  it("extracts BPD from spoken text", () => {
    const r = parseVoiceProtocol("бпр 52");
    assert.equal(r.data.bpd, 52);
    assert.equal(r.need_clarification, undefined);
  });
});
