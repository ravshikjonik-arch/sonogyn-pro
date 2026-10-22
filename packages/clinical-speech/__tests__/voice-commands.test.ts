import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyVoiceCommands } from "../src/postprocess/voice-commands";

describe("applyVoiceCommands", () => {
  it("replaces spoken punctuation", () => {
    const r = applyVoiceCommands("размер три точка пять запятая два");
    assert.equal(r.text, "размер три. пять, два");
    assert.equal(r.sideEffect, null);
  });

  it("clears on очистить", () => {
    const r = applyVoiceCommands("текст очистить");
    assert.equal(r.text, "");
    assert.equal(r.sideEffect, "clear");
  });

  it("sets read side effect", () => {
    const r = applyVoiceCommands("заключение прочитать");
    assert.equal(r.sideEffect, "read");
    assert.match(r.text, /заключение/);
  });
});
