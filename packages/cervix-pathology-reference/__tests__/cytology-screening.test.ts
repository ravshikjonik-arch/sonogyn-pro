import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BethesdaAssistInputSchema,
  CytologyScreeningInputSchema,
  getCytologyClinicalCases,
  getCytologyDashboardTopics,
  getCytologyModuleMeta,
  interpretBethesdaAssist,
  recommendCytologyScreening,
} from "../src/cytology";

describe("cytology screening engine", () => {
  it("recommends colposcopy for HSIL", () => {
    const rec = recommendCytologyScreening({ age: 35, cytology: "hsil" });
    assert.equal(rec.colposcopyNeeded, true);
    assert.equal(rec.riskLevel, "high");
    assert.match(rec.summary, /HSIL/i);
  });

  it("triages ASC-US with HPV positive", () => {
    const rec = recommendCytologyScreening({
      age: 32,
      cytology: "asc-us",
      hpvStatus: "positive",
    });
    assert.equal(rec.colposcopyNeeded, true);
    assert.ok(rec.actionsNow.some((a) => a.includes("Кольпоскопия")));
  });

  it("handles unsatisfactory cytology", () => {
    const rec = recommendCytologyScreening({ age: 28, cytology: "unsatisfactory" });
    assert.equal(rec.repeatCytologyMonths, 3);
    assert.equal(rec.colposcopyNeeded, false);
  });

  it("prioritizes HSIL over post-treatment HPV surveillance", () => {
    const rec = recommendCytologyScreening({
      age: 35,
      cytology: "hsil",
      hpvStatus: "16-positive",
      priorExcision: true,
    });
    assert.equal(rec.riskLevel, "high");
    assert.equal(rec.colposcopyNeeded, true);
    assert.match(rec.summary, /HSIL/i);
  });

  it("returns post-treatment surveillance for NILM after excision with HPV+", () => {
    const rec = recommendCytologyScreening({
      age: 40,
      cytology: "nilm",
      hpvStatus: "16-positive",
      priorExcision: true,
    });
    assert.match(rec.summary, /excision/i);
    assert.equal(rec.colposcopyNeeded, true);
  });

  it("adds pregnancy note when pregnant flag is set", () => {
    const rec = recommendCytologyScreening({ age: 30, cytology: "lsil", pregnant: true });
    assert.ok(rec.actionsNow.some((a) => a.includes("Беременность")));
  });
});

describe("bethesda assist", () => {
  it("returns patient-friendly explanation", () => {
    const result = interpretBethesdaAssist({
      age: 29,
      cytology: "lsil",
      hpvStatus: "positive",
    });
    assert.ok(result.explainToPatient.length > 10);
    assert.ok(result.nextSteps.length >= 1);
    assert.match(result.disclaimer, /образователь/i);
  });
});

describe("cytology data loaders", () => {
  it("loads module meta and 16 dashboard topics", () => {
    const meta = getCytologyModuleMeta();
    assert.ok(meta.title.includes("Цитолог"));
    const topics = getCytologyDashboardTopics();
    assert.equal(topics.length, 16);
  });

  it("loads clinical cases with valid structure", () => {
    const cases = getCytologyClinicalCases();
    assert.ok(cases.length >= 10);
    for (const c of cases) {
      assert.ok(c.options.length >= 2);
      assert.ok(c.correctIndex >= 0 && c.correctIndex < c.options.length);
    }
  });
});

describe("cytology zod schemas", () => {
  it("validates screening input", () => {
    const parsed = CytologyScreeningInputSchema.safeParse({ age: 30, cytology: "nilm", hpvStatus: "negative" });
    assert.equal(parsed.success, true);
  });

  it("rejects invalid age", () => {
    const parsed = CytologyScreeningInputSchema.safeParse({ age: 5 });
    assert.equal(parsed.success, false);
  });

  it("validates bethesda assist input", () => {
    const parsed = BethesdaAssistInputSchema.safeParse({
      age: 40,
      cytology: "asc-us",
      hpvStatus: "unknown",
    });
    assert.equal(parsed.success, true);
  });
});
