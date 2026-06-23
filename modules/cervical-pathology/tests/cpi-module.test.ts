import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateCpiCase } from "../src/application/evaluate-case.handler";
import { evaluateBethesdaTriage } from "../src/calculators/bethesda-engine";
import { evaluateHpvRisk } from "../src/calculators/hpv-engine";
import { evaluateHistologyProgression } from "../src/calculators/histology-engine";
import { calculateQualityScore } from "../src/calculators/risk-engine";
import { mapSwedeToIfcpcFindings } from "../src/calculators/swede-engine";
import { CpiCaseInputSchema } from "../src/domain/schemas";
import {
  generateCpiDocxReport,
  generateCpiHtmlReport,
  generateCpiPdfReport,
  generateCpiReport,
} from "../src/protocols/report-generator";

function sampleCase() {
  return CpiCaseInputSchema.parse({
    colposcopy: {
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz2",
      findingSignIds: ["dense_acetowhite", "coarse_punctation"],
    },
    hpv: {
      status: "positive",
      genotypes: ["hpv16"],
      viralLoad: "high",
      persistent: true,
    },
    cytology: { result: "hsil" },
    histology: { result: "pending" },
    swede: { acetowhite: 2, margins: 1, vessels: 1, lesionSize: 1, iodine: 1 },
    clinical: {
      age: 32,
      pregnancy: false,
      immunosuppression: false,
      smoking: true,
      priorCinTreatment: "none",
      glandularSuspicion: "none",
      suspectedGlandularLesion: false,
    },
    quality: {
      scjDocumented: true,
      tzDocumented: true,
      aceticAcidAssessment: true,
      iodineTestPerformed: true,
      lesionDocumented: true,
      photoPreAcetic: true,
      photoPostAcetic: true,
      photoPostSchiller: true,
      adequacyDocumented: true,
    },
  });
}

describe("CPI module — domain & engines", () => {
  it("validates full case input schema", () => {
    const c = sampleCase();
    assert.equal(c.hpv.genotypes[0], "hpv16");
  });

  it("evaluates full CPI case with risk and CDS", () => {
    const result = evaluateCpiCase(sampleCase());
    assert.equal(result.schema, "cpi.evaluation.v1");
    assert.ok(result.risk.cin2PlusRisk > 0.2);
    assert.ok(result.actions.length >= 1);
    assert.ok(result.swedeTotal !== null && result.swedeTotal >= 4);
    assert.ok(result.qualityScore !== null && result.qualityScore >= 90);
    assert.match(result.disclaimer, /clinical judgment/i);
  });

  it("HPV16 persistent → very_high band", () => {
    const profile = evaluateHpvRisk({
      status: "positive",
      genotypes: ["hpv16"],
      viralLoad: "high",
      persistent: true,
    });
    assert.equal(profile.band, "very_high");
    assert.ok(profile.cin2plusModifier > 0.3);
  });

  it("Bethesda HSIL → mandatory biopsy threshold", () => {
    const triage = evaluateBethesdaTriage(
      { result: "hsil" },
      { status: "positive", genotypes: ["hpv16"], viralLoad: "not_available", persistent: false },
      {
        adequacyId: "adequacy_satisfactory",
        scjVisibilityId: "scj_completely_visible",
        transformationZoneTypeId: "tz1",
        findingSignIds: [],
      },
    );
    assert.equal(triage.biopsyThreshold, "mandatory");
  });

  it("histology CIN3 progression model", () => {
    const p = evaluateHistologyProgression({ result: "cin3" });
    assert.equal(p.stage, "CIN3");
    assert.ok(p.progressionRisk >= 0.5);
  });

  it("Swede maps to IFCPC finding ids", () => {
    const ids = mapSwedeToIfcpcFindings({
      acetowhite: 2,
      margins: 2,
      vessels: 2,
      lesionSize: 0,
      iodine: 0,
    });
    assert.ok(ids.includes("dense_acetowhite"));
    assert.ok(ids.includes("atypical_vessels"));
  });

  it("quality score expert tier", () => {
    const q = calculateQualityScore({
      scjDocumented: true,
      tzDocumented: true,
      aceticAcidAssessment: true,
      iodineTestPerformed: true,
      lesionDocumented: true,
      photoPreAcetic: true,
      photoPostAcetic: true,
      photoPostSchiller: true,
      adequacyDocumented: true,
    });
    assert.equal(q.score, 100);
    assert.match(q.interpretation, /Expert/);
  });
});

describe("CPI module — reports", () => {
  it("generates HTML, PDF, DOCX reports", () => {
    const input = sampleCase();
    const evaluation = evaluateCpiCase(input);
    const html = generateCpiHtmlReport(input, evaluation);
    assert.match(html, /Cervical Pathology Intelligence/);

    const pdf = generateCpiPdfReport(input, evaluation);
    assert.match(pdf.toString("utf8", 0, 8), /^%PDF-1.4/);

    const docx = generateCpiDocxReport(input, evaluation);
    assert.ok(docx.length > 100);
    assert.equal(docx.readUInt32LE(0), 0x04034b50);

    const unified = generateCpiReport("pdf", input, evaluation);
    assert.equal(unified.mimeType, "application/pdf");
  });
});

describe("CPI module — clinical rules", () => {
  it("TZ3 triggers ECC in evaluation", () => {
    const input = sampleCase();
    input.colposcopy.transformationZoneTypeId = "tz3";
    input.colposcopy.scjVisibilityId = "scj_not_visible";
    const result = evaluateCpiCase(input);
    assert.ok(result.actions.some((a) => a.action === "ecc"));
  });

  it("invasion signs elevate oncology referral pathway", () => {
    const input = sampleCase();
    input.colposcopy.findingSignIds = ["atypical_vessels", "necrosis"];
    input.cytology.result = "hsil";
    const result = evaluateCpiCase(input);
    assert.ok(
      result.actions.some((a) => a.action === "referral_oncologist" || a.action === "targeted_biopsy"),
    );
  });
});
