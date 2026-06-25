import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessProtocolCompleteness,
  buildClinicalDecisionSupport,
  generateIsuogReport,
  runObstetricCopilot,
} from "./obstetricCopilot";

describe("assessProtocolCompleteness", () => {
  it("scores protocol with biometry data", () => {
    const out = assessProtocolCompleteness({
      gestationalAge: { weeks: 22 },
      findings: ["Вентрикуломегалия"],
      biometricData: { bpdMm: 52, hcMm: 178, acMm: 168, flMm: 38, lateralVentricleMm: 13 },
    });

    assert.equal(out.window, "second_trimester");
    assert.ok(out.completenessScore >= 0);
    assert.ok(out.checklist.mustNotMiss.length >= 3);
    assert.ok(out.completed.measure.some((m) => /BPD/i.test(m)));
  });
});

describe("buildClinicalDecisionSupport", () => {
  it("recommends MRI and genetics for ACC differential", () => {
    const copilot = runObstetricCopilot({
      gestationalAge: { weeks: 22 },
      findings: ["Вентрикуломегалия 13 мм", "Отсутствует CSP"],
      biometricData: { lateralVentricleMm: 13 },
    });

    const types = copilot.clinicalDecision.actions.map((a) => a.type);
    assert.ok(types.includes("fetal_mri") || types.includes("karyotype"));
    assert.ok(types.includes("genetic_counseling"));
  });
});

describe("generateIsuogReport", () => {
  it("includes biometry and disclaimer blocks", () => {
    const out = runObstetricCopilot({
      gestationalAge: { weeks: 22 },
      findings: ["Вентрикуломегалия 13 мм"],
      biometricData: { bpdMm: 52, hcMm: 178, acMm: 168, flMm: 38, lateralVentricleMm: 13 },
    });

    assert.ok(out.report.fullText.includes("ISUOG"));
    assert.ok(out.report.blocks.biometry?.includes("BPD"));
    assert.ok(out.report.recommendations.length >= 2);
  });
});

describe("runObstetricCopilot — full pipeline", () => {
  it("runs all stages for brain midline case", () => {
    const out = runObstetricCopilot({
      gestationalAge: { weeks: 22 },
      findings: ["Вентрикуломегалия 13 мм", "Отсутствует CSP"],
      biometricData: { lateralVentricleMm: 13, bpdMm: 52, hcMm: 178, acMm: 168, flMm: 38 },
      uaPi: 1.0,
      mcaPi: 1.4,
      maternalAgeYears: 30,
    });

    assert.ok(out.sonographer.differential.length >= 3);
    assert.ok(out.biometry);
    assert.ok(out.doppler);
    assert.ok(out.protocol.checklist.labelRu.includes("II"));
    assert.ok(out.clinicalDecision.actions.length >= 2);
    assert.ok(out.executiveSummaryRu.includes("22"));
    assert.ok(out.report.fullText.length > 100);
  });

  it("runs first trimester aneuploidy block", () => {
    const out = runObstetricCopilot({
      gestationalAge: { weeks: 12 },
      findings: [],
      maternalAgeYears: 35,
      ntMm: 4.0,
      nasalBone: "absent",
      includeBiometry: false,
      includeDoppler: false,
    });

    assert.ok(out.aneuploidy);
    assert.equal(out.aneuploidy!.riskLevel, "high");
    assert.ok(out.report.blocks.aneuploidy?.includes("Трисомия"));
  });
});
