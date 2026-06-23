import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { enrichCpiContext } from "./blocks/enrich-context";
import { runCpiClinicalDecision, getCpiRulesDocument } from "./engine/decision-engine";
import { evaluateRuleCondition } from "./engine/rules-engine";
import type { CpiPatientInput } from "./types";

const BASE: CpiPatientInput = {
  age: 35,
  pregnancy: false,
  immunodeficiency: false,
  adequacyId: "adequacy_satisfactory",
  scjVisibilityId: "scj_completely_visible",
  transformationZoneTypeId: "tz1",
  ifcpcFindingSignIds: [],
  hpvStatus: "positive",
  hpv16Positive: false,
  hpv18Positive: false,
  hpv3133455258Positive: false,
  otherHrHpvPositive: true,
  viralLoad: "not_available",
  cytology: "lsil",
  glandularSuspicion: "none",
  endocervicalComponentPresent: null,
  suspectedGlandularLesion: false,
  priorBiopsy: "none",
  priorCinTreatment: "none",
  currentBiopsyResult: "none",
};

describe("CPI Clinical Decision Engine", () => {
  it("loads rules document with sources", () => {
    const doc = getCpiRulesDocument();
    assert.ok(doc.rules.length >= 20);
    assert.ok(doc.sources.some((s) => s.organization === "ASCCP"));
  });

  it("LSIL + HPV negative → observation pathway", () => {
    const result = runCpiClinicalDecision({
      ...BASE,
      hpvStatus: "negative",
      otherHrHpvPositive: false,
      cytology: "lsil",
    });
    assert.ok(result.actions.some((a) => a.action === "observation"));
    assert.ok(result.explanation.sources.length > 0);
  });

  it("HSIL + HPV16 + TZ3 → ECC and conization", () => {
    const result = runCpiClinicalDecision({
      ...BASE,
      cytology: "hsil",
      hpv16Positive: true,
      transformationZoneTypeId: "tz3",
      scjVisibilityId: "scj_not_visible",
      ifcpcFindingSignIds: ["dense_acetowhite"],
    });
    const actionIds = result.actions.map((a) => a.action);
    assert.ok(actionIds.includes("ecc"));
    assert.ok(actionIds.includes("targeted_biopsy"));
    assert.ok(result.tz3Alert?.includes("CIN3"));
    assert.ok(result.explanation.matchedRules.length > 0);
  });

  it("invasion signs → oncology referral", () => {
    const result = runCpiClinicalDecision({
      ...BASE,
      cytology: "hsil",
      ifcpcFindingSignIds: ["atypical_vessels", "necrosis"],
    });
    assert.ok(result.actions.some((a) => a.action === "oncology_referral"));
    assert.equal(result.combinedRiskBand, "critical");
  });

  it("AGC → glandular alert and ECC", () => {
    const result = runCpiClinicalDecision({
      ...BASE,
      cytology: "agc",
      glandularSuspicion: "agc_favor_neoplasia",
    });
    assert.ok(result.glandularAlert);
    assert.ok(result.actions.some((a) => a.action === "ecc"));
  });

  it("each action has guideline sources", () => {
    const result = runCpiClinicalDecision({
      ...BASE,
      cytology: "hsil",
      hpv16Positive: true,
      ifcpcFindingSignIds: ["dense_acetowhite", "coarse_punctation"],
    });
    for (const action of result.actions) {
      assert.ok(action.sources.length > 0, action.action);
      assert.ok(action.rationale.length > 10, action.action);
    }
  });

  it("decision tree path is populated", () => {
    const result = runCpiClinicalDecision(BASE);
    assert.ok(result.explanation.decisionTreePath.length >= 5);
    assert.ok(result.explanation.decisionTreePath[0].startsWith("START"));
  });

  it("quality score affects repeat colposcopy rule", () => {
    const result = runCpiClinicalDecision({
      ...BASE,
      quality: {
        photoPreAcetic: false,
        photoPostAcetic: false,
        photoPostSchiller: false,
        tzDocumented: true,
        adequacyDocumented: false,
        scjDocumented: false,
      },
    });
    assert.ok((result.qualityScore ?? 100) < 70);
    assert.ok(result.actions.some((a) => a.action === "repeat_colposcopy"));
  });

  it("rules engine evaluates nested fields", () => {
    assert.ok(
      evaluateRuleCondition(
        { risk: { cin2plus: 0.4 }, flags: { invasionSignsPresent: false } },
        { field: "risk.cin2plus", op: "gte", value: 0.35 },
      ),
    );
  });

  it("enrich context computes HPV band LSIL HPV-", () => {
    const ctx = enrichCpiContext({
      ...BASE,
      hpvStatus: "negative",
      otherHrHpvPositive: false,
      cytology: "lsil",
    });
    assert.equal(ctx.hpv.riskBand, "low");
  });
});
