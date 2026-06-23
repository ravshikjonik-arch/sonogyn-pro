import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateCinRisk, getCinRiskModelMeta } from "./cin-risk/model";
import { CinRiskCalculatorInputSchema } from "./cin-risk/schema";

describe("CIN risk calculator", () => {
  it("low risk for NILM HPV negative young patient", () => {
    const result = calculateCinRisk({
      age: 28,
      hpvStatus: "negative",
      hpv16Positive: false,
      hpv18Positive: false,
      otherHrHpvPositive: false,
      cytology: "nilm",
      transformationZoneTypeId: "tz1",
      ifcpcFindingSignIds: ["normal_squamous_epithelium"],
      priorBiopsy: "none",
      immunodeficiency: false,
      pregnancy: false,
      priorCinTreatment: "none",
    });
    assert.ok(result.cin2plus < 0.1, `expected low CIN2+, got ${result.cin2plus}`);
    assert.equal(result.cin2plusTier.tier, "very_low");
  });

  it("high CIN2+ for HSIL + HPV16 + IFCPC major", () => {
    const result = calculateCinRisk({
      age: 38,
      hpvStatus: "positive",
      hpv16Positive: true,
      hpv18Positive: false,
      otherHrHpvPositive: false,
      cytology: "hsil",
      transformationZoneTypeId: "tz2",
      ifcpcFindingSignIds: ["dense_acetowhite", "coarse_punctation", "sharp_border"],
      priorBiopsy: "none",
      immunodeficiency: false,
      pregnancy: false,
      priorCinTreatment: "none",
    });
    assert.ok(result.cin2plus > 0.35, `expected high CIN2+, got ${result.cin2plus}`);
    assert.ok(result.cin3plus > 0.15);
    assert.equal(result.recommendation.urgency, "urgent");
  });

  it("invasion signs elevate invasion probability", () => {
    const base = calculateCinRisk({
      age: 45,
      hpvStatus: "positive",
      hpv16Positive: true,
      hpv18Positive: false,
      otherHrHpvPositive: false,
      cytology: "hsil",
      transformationZoneTypeId: "tz2",
      ifcpcFindingSignIds: ["dense_acetowhite"],
      priorBiopsy: "none",
      immunodeficiency: false,
      pregnancy: false,
      priorCinTreatment: "none",
    });
    const withInvasion = calculateCinRisk({
      ...{
        age: 45,
        hpvStatus: "positive" as const,
        hpv16Positive: true,
        hpv18Positive: false,
        otherHrHpvPositive: false,
        cytology: "hsil" as const,
        transformationZoneTypeId: "tz2" as const,
        priorBiopsy: "none" as const,
        immunodeficiency: false,
        pregnancy: false,
        priorCinTreatment: "none" as const,
      },
      ifcpcFindingSignIds: ["dense_acetowhite", "atypical_vessels", "necrosis"],
    });
    assert.ok(withInvasion.invasion > base.invasion);
    assert.ok(withInvasion.invasion > 0.05);
  });

  it("probabilities sum to approximately 1", () => {
    const result = calculateCinRisk({
      age: 32,
      hpvStatus: "positive",
      hpv16Positive: false,
      hpv18Positive: false,
      otherHrHpvPositive: true,
      cytology: "ascus",
      transformationZoneTypeId: "tz1",
      ifcpcFindingSignIds: ["thin_acetowhite"],
      priorBiopsy: "negative",
      immunodeficiency: false,
      pregnancy: false,
      priorCinTreatment: "none",
    });
    const sum = result.probabilities.reduce((a, p) => a + p.probability, 0);
    assert.ok(Math.abs(sum - 1) < 0.001);
  });

  it("Zod schema validates input", () => {
    const parsed = CinRiskCalculatorInputSchema.parse({
      age: 35,
      hpvStatus: "positive",
      hpv16Positive: true,
      hpv18Positive: false,
      otherHrHpvPositive: false,
      cytology: "lsil",
      transformationZoneTypeId: "tz1",
      ifcpcFindingSignIds: [],
      priorBiopsy: "none",
      immunodeficiency: false,
      pregnancy: false,
      priorCinTreatment: "none",
    });
    assert.equal(parsed.age, 35);
  });

  it("model meta includes formula", () => {
    const meta = getCinRiskModelMeta();
    assert.ok(meta.formula.logit.includes("softmax") || meta.formula.probability.includes("exp"));
  });
});
