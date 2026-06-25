import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  analyzeFinding,
  generateReport,
  runSonographerCopilot,
  suggestAdditionalViews,
  suggestMeasurements,
} from "./sonographerAssistant";

describe("analyzeFinding", () => {
  it("links ventriculomegaly to brain pathologies", () => {
    const a = analyzeFinding("Вентрикуломегалия 13 мм", { gestationalAge: { weeks: 22 } });
    assert.ok(a.tokens.includes("ventriculomegaly"));
    assert.ok(a.explanation.length > 20);
    assert.ok(a.relatedPathologies.length >= 1);
  });
});

describe("suggestMeasurements", () => {
  it("requires atrial width when ventriculomegaly", () => {
    const m = suggestMeasurements(
      { gestationalAge: { weeks: 22 }, biometricData: { lateralVentricleMm: 13 } },
      ["Вентрикуломегалия"],
    );
    assert.ok(m.some((x) => x.parameter === "LV_ATRIUM"));
    assert.ok(m.some((x) => x.parameter === "BPD"));
  });
});

describe("suggestAdditionalViews", () => {
  it("suggests midsagittal brain for CSP absent", () => {
    const v = suggestAdditionalViews(
      { gestationalAge: { weeks: 22 } },
      ["Отсутствует CSP", "Вентрикуломегалия"],
    );
    assert.ok(v.some((x) => /sagittal|midsagittal|coronal/i.test(x.view)));
  });
});

describe("generateReport", () => {
  it("produces ISUOG disclaimer and differential", () => {
    const r = generateReport(
      {
        gestationalAge: { weeks: 22 },
        findings: ["Вентрикуломегалия 13 мм", "Отсутствует CSP"],
        biometricData: { lateralVentricleMm: 13 },
      },
      "detailed",
    );
    assert.ok(r.isuogDisclaimer.includes("ISUOG"));
    assert.ok(r.detailedConclusion.includes("Агенезия") || r.detailedConclusion.includes("дифференциал"));
    assert.ok(r.recommendations.length >= 2);
  });
});

describe("runSonographerCopilot", () => {
  it("returns full pipeline for doctor input", () => {
    const out = runSonographerCopilot({
      gestationalAge: { weeks: 22 },
      findings: ["Вентрикуломегалия 13 мм", "Отсутствует CSP"],
      biometricData: { lateralVentricleMm: 13 },
    });
    assert.equal(out.analyses.length, 2);
    assert.ok(out.differential.length >= 3);
    assert.ok(out.measurements.length >= 3);
    assert.ok(out.views.length >= 3);
    assert.ok(out.protocol.mustNotMiss.length >= 3);
    assert.ok(out.report.sections.impression.length > 10);
  });
});
