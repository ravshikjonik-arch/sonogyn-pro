import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveOradsAssistContext } from "../src/assist/resolveOradsAssistContext";
import { runOradsAssistPipeline } from "../src/assist/runOradsAssistPipeline";

describe("runOradsAssistPipeline", () => {
  it("uses profile age over text age", () => {
    const r = runOradsAssistPipeline("возраст 40 лет, киста 30 мм", { profileAgeYears: 52, uiMenopause: "pre" });
    assert.equal(r.context.ageYears, 52);
    assert.equal(r.context.ageSource, "profile");
  });

  it("shows post-menopause hint without switching menopause", () => {
    const r = runOradsAssistPipeline("киста 40 мм", { profileAgeYears: 55, uiMenopause: "pre" });
    assert.equal(r.context.menopause, "pre");
    assert.equal(r.context.postMenopauseHint, true);
  });

  it("prefers text menopause over ui", () => {
    const ctx = resolveOradsAssistContext({
      textMenopause: "post",
      uiMenopause: "pre",
    });
    assert.equal(ctx.menopause, "post");
    assert.equal(ctx.menopauseSource, "text");
  });
});
