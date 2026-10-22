import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateSpeechAudioUpload } from "../validate-audio-upload";

describe("validateSpeechAudioUpload", () => {
  it("rejects empty payload", () => {
    const r = validateSpeechAudioUpload({ bytes: new Uint8Array(), declaredMime: "audio/webm" });
    assert.equal(r.ok, false);
  });

  it("accepts webm magic bytes", () => {
    const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
    const r = validateSpeechAudioUpload({ bytes, declaredMime: null });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.mime, "audio/webm");
  });
});
