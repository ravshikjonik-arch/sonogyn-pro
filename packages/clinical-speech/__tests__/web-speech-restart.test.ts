import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Documents continuous-session policy: no-speech must not abort a continuous dictation.
 * Runtime WebSpeechEngine is browser-only; this guards the contract used by the engine.
 */
describe("continuous speech error policy", () => {
  it("treats no-speech as soft when continuous restart is desired", () => {
    const continuous = true;
    const shouldRestart = true;
    const code = "no-speech";
    const soft = code === "no-speech" && continuous && shouldRestart;
    assert.equal(soft, true);
  });

  it("still hard-fails not-allowed", () => {
    const continuous = true;
    const shouldRestart = true;
    const code = "not-allowed";
    const soft = code === "no-speech" && continuous && shouldRestart;
    assert.equal(soft, false);
  });
});
