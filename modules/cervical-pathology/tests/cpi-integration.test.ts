import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateCpiCase } from "../src/application/evaluate-case.handler";
import { runClinicalDecisionSupport } from "../src/calculators/decision-engine";
import { evaluateBethesdaTriage } from "../src/calculators/bethesda-engine";
import { evaluateHistologyProgression } from "../src/calculators/histology-engine";
import { CpiCaseInputSchema } from "../src/domain/schemas";
import { SupabaseCpiRepository } from "../src/infrastructure/supabase/cpi-repository";
import { generateCpiReport } from "../src/protocols/report-generator";
import { createMockSupabaseClient } from "./helpers/mock-supabase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PATIENT_ID = "22222222-2222-4222-8222-222222222222";

function minimalCase(patientId?: string) {
  return CpiCaseInputSchema.parse({
    patientId,
    colposcopy: {
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz2",
      findingSignIds: ["dense_acetowhite"],
    },
    hpv: { status: "positive", genotypes: ["hpv16"], viralLoad: "high", persistent: false },
    cytology: { result: "hsil" },
    histology: { result: "none" },
    clinical: {
      age: 34,
      pregnancy: false,
      immunosuppression: false,
      smoking: false,
      priorCinTreatment: "none",
      glandularSuspicion: "none",
      suspectedGlandularLesion: false,
    },
  });
}

describe("CPI — SupabaseCpiRepository (integration mock)", () => {
  it("createAndEvaluate persists case + snapshots", async () => {
    const supabase = createMockSupabaseClient();
    const repo = new SupabaseCpiRepository(supabase);
    const input = minimalCase(PATIENT_ID);

    const result = await repo.createAndEvaluate(USER_ID, input);
    assert.ok(result.caseId);
    assert.equal(result.evaluation.schema, "cpi.evaluation.v1");
    assert.ok(result.evaluation.actions.length >= 1);

    assert.equal(supabase.__tables.get("cpi_cases")!.length, 1);
    assert.equal(supabase.__tables.get("cpi_risk_results")!.length, 1);
    assert.equal(supabase.__tables.get("cpi_decisions")!.length, 1);
    assert.equal(supabase.__tables.get("cpi_audit_log")!.length, 1);
  });

  it("getCase returns persisted evaluation payload", async () => {
    const supabase = createMockSupabaseClient();
    const repo = new SupabaseCpiRepository(supabase);
    const { caseId } = await repo.createAndEvaluate(USER_ID, minimalCase());

    const record = await repo.getCase(USER_ID, caseId);
    assert.ok(record);
    assert.equal(record!.id, caseId);
    assert.equal(record!.evaluation?.schema, "cpi.evaluation.v1");
    assert.ok(record!.evaluation!.risk.cin2PlusRisk > 0);
  });

  it("listCases returns user cases", async () => {
    const supabase = createMockSupabaseClient();
    const repo = new SupabaseCpiRepository(supabase);
    await repo.createAndEvaluate(USER_ID, minimalCase());
    await repo.createAndEvaluate(USER_ID, minimalCase());

    const list = await repo.listCases(USER_ID);
    assert.equal(list.length, 2);
  });

  it("saveReport inserts report row", async () => {
    const supabase = createMockSupabaseClient();
    const repo = new SupabaseCpiRepository(supabase);
    const { caseId } = await repo.createAndEvaluate(USER_ID, minimalCase());

    const reportId = await repo.saveReport(caseId, "html", "<html>ok</html>");
    assert.ok(reportId);
    assert.equal(supabase.__tables.get("cpi_reports")!.length, 1);
  });
});

describe("CPI — API evaluate contract", () => {
  it("evaluateCpiCase matches POST /api/cpi/evaluate response shape", () => {
    const input = minimalCase();
    const evaluation = evaluateCpiCase(input);
    assert.equal(evaluation.version, "1.0.0");
    assert.ok(Array.isArray(evaluation.actions));
    assert.ok(typeof evaluation.explanation === "string");
    assert.ok(evaluation.risk.confidenceScore >= 0 && evaluation.risk.confidenceScore <= 1);
  });

  it("invalid payload fails schema (400 contract)", () => {
    const parsed = CpiCaseInputSchema.safeParse({ colposcopy: {} });
    assert.equal(parsed.success, false);
  });
});

describe("CPI — clinical engines coverage", () => {
  it("Bethesda matrix covers SCC", () => {
    const t = evaluateBethesdaTriage(
      { result: "scc" },
      { status: "positive", genotypes: ["hpv16"], viralLoad: "not_available", persistent: false },
      {
        adequacyId: "adequacy_satisfactory",
        scjVisibilityId: "scj_completely_visible",
        transformationZoneTypeId: "tz1",
        findingSignIds: [],
      },
    );
    assert.equal(t.biopsyThreshold, "mandatory");
    assert.match(t.summary, /oncology|SCC/i);
  });

  it("histology invasive stage", () => {
    const h = evaluateHistologyProgression({ result: "invasive" });
    assert.equal(h.stage, "invasive");
    assert.ok(h.progressionRisk >= 0.9);
  });

  it("CDS returns actions for HSIL case", () => {
    const input = minimalCase();
    const evaluation = evaluateCpiCase(input);
    const cds = runClinicalDecisionSupport(input, input.colposcopy.findingSignIds, evaluation.risk);
    assert.ok(cds.actions.length >= 1);
    assert.ok(cds.explanation.length > 20);
  });

  it("report formats all produce bodies", () => {
    const input = minimalCase();
    const evaluation = evaluateCpiCase(input);
    for (const format of ["html", "pdf", "docx"] as const) {
      const r = generateCpiReport(format, input, evaluation);
      assert.ok(r.body);
      assert.ok(r.filename.includes(format === "html" ? "html" : format));
    }
  });
});
