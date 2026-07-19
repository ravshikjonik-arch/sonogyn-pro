import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyOradsClinicalMemory } from "../src/assist/clinicalReasoning";
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

  it("builds clinical reasoning with critical questions for incomplete complex lesion", () => {
    const r = runOradsAssistPipeline("левый яичник, сложная киста 55 мм, перегородки", { uiMenopause: "pre" });

    assert.match(r.clinicalReasoning.summary, /сложн|мультилокуляр/i);
    assert.match(r.clinicalReasoning.workingCategory, /уточн|не фикс/i);
    assert.ok(
      r.clinicalReasoning.missingQuestions.some((q) =>
        q.priority === "critical" && /солидн|папилляр/i.test(q.question),
      ),
    );
    assert.ok(
      r.clinicalReasoning.missingQuestions.some((q) =>
        q.priority === "critical" && /кровоток|color score/i.test(q.question),
      ),
    );
  });

  it("keeps physician guardrail and safety flag for ascites modifier", () => {
    const r = runOradsAssistPipeline(
      "правый яичник, простая анэхогенная киста 40 мм, гладкие контуры, без перегородок, асцит есть",
      { uiMenopause: "pre" },
    );

    assert.ok(r.clinicalReasoning.physicianGuardrail.includes("врачом"));
    assert.ok(r.ascitesModifierSuggested);
    assert.ok(r.clinicalReasoning.safetyFlags.some((flag) => /асцит/i.test(flag)));
  });

  it("can attach visible clinical memory without changing the category", () => {
    const r = runOradsAssistPipeline("киста 40 мм, гладкие контуры, без перегородок", { uiMenopause: "pre" });
    const withMemory = applyOradsClinicalMemory(r.clinicalReasoning, [
      {
        scope: "doctor",
        title: "Похожее исправление врача",
        detail: "Врач раньше исправлял похожий случай.",
        weight: "medium",
      },
    ]);

    assert.equal(withMemory.memoryInsights.length, 1);
    assert.equal(r.categoryNumber, 2);
    assert.match(withMemory.nextActions[0] ?? "", /памяти/i);
  });
});
