import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessIfcpcExam, finalizeIfcpcExam } from "./engine/assess-exam";
import {
  IFCPC_SECTIONS,
  IFCPC_SIGNS,
  getIfcpcSignsBySection,
  validateIfcpcNomenclature,
} from "./knowledge/nomenclature";
import {
  CreateIfcpcExamBodySchema,
  IfcpcColposcopyExamSchema,
} from "./schema/api-schema";

describe("ifcpc-expert nomenclature", () => {
  it("loads 7 sections and 27 signs", () => {
    assert.equal(IFCPC_SECTIONS.length, 7);
    assert.equal(IFCPC_SIGNS.length, 27);
    validateIfcpcNomenclature();
  });

  it("every sign has required clinical metadata", () => {
    for (const sign of IFCPC_SIGNS) {
      assert.ok(sign.definition.length > 20, sign.id);
      assert.ok(sign.diagnosticSignificance.length > 10, sign.id);
      assert.ok(sign.biopsyRecommendation.length > 10, sign.id);
      assert.ok(sign.cinRiskNarrative.length > 5, sign.id);
      assert.ok(sign.hsilNarrative.length > 5, sign.id);
      assert.ok(sign.invasionNarrative.length > 5, sign.id);
    }
  });

  it("grade1 and grade2 sections contain expected ids", () => {
    const g1 = getIfcpcSignsBySection("abnormal_grade1").map((s) => s.id);
    const g2 = getIfcpcSignsBySection("abnormal_grade2").map((s) => s.id);
    assert.deepEqual(g1.sort(), ["fine_mosaic", "fine_punctation", "thin_acetowhite"].sort());
    assert.ok(g2.includes("dense_acetowhite"));
    assert.ok(g2.includes("cuffed_crypt_orifices"));
  });

  it("invasion signs trigger urgent biopsy", () => {
    const assessment = assessIfcpcExam({
      schema: "ifcpc.colposcopy.exam",
      version: "1.0.0",
      performedAt: new Date().toISOString(),
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz1",
      findingSignIds: ["atypical_vessels", "dense_acetowhite"],
    });
    assert.equal(assessment.biopsyUrgency, "urgent");
    assert.equal(assessment.overallImpression, "invasion_suspicion");
    assert.equal(assessment.highestColposcopicGrade, 2);
  });

  it("normal findings only → benign impression", () => {
    const assessment = assessIfcpcExam({
      schema: "ifcpc.colposcopy.exam",
      version: "1.0.0",
      performedAt: new Date().toISOString(),
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz1",
      findingSignIds: ["ectopy", "nabothian_cysts"],
    });
    assert.equal(assessment.overallImpression, "benign_variants");
    assert.ok(assessment.flags.includes("normal_only"));
  });

  it("finalizeIfcpcExam attaches assessment", () => {
    const exam = finalizeIfcpcExam({
      schema: "ifcpc.colposcopy.exam",
      version: "1.0.0",
      performedAt: new Date().toISOString(),
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz2",
      findingSignIds: ["coarse_punctation"],
    });
    assert.ok(exam.assessment);
    assert.equal(exam.assessment?.biopsyUrgency, "mandatory");
  });
});

describe("ifcpc-expert API schema", () => {
  it("CreateIfcpcExamBodySchema accepts valid payload", () => {
    const parsed = CreateIfcpcExamBodySchema.parse({
      schema: "ifcpc.colposcopy.exam",
      version: "1.0.0",
      performedAt: "2026-06-20T10:00:00+03:00",
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz1",
      findingSignIds: ["thin_acetowhite"],
      computeAssessment: true,
    });
    assert.equal(parsed.findingSignIds.length, 1);
  });

  it("IfcpcColposcopyExamSchema rejects invalid sign id", () => {
    assert.throws(() =>
      IfcpcColposcopyExamSchema.parse({
        schema: "ifcpc.colposcopy.exam",
        version: "1.0.0",
        performedAt: "2026-06-20T10:00:00+03:00",
        adequacyId: "adequacy_satisfactory",
        scjVisibilityId: "scj_completely_visible",
        transformationZoneTypeId: "tz1",
        findingSignIds: ["not_a_real_sign"],
      }),
    );
  });
});
