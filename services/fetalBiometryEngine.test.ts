import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessFetalBiometry } from "./fetalBiometryEngine";

describe("assessFetalBiometry — INTERGROWTH", () => {
  it("computes percentiles for standard biometry at 22 weeks", () => {
    const out = assessFetalBiometry({
      gestationalAge: { weeks: 22 },
      bpdMm: 52.5,
      hcMm: 178,
      acMm: 168,
      flMm: 43,
      standard: "intergrowth",
    });

    assert.equal(out.standard, "intergrowth");
    assert.ok(out.measurements.length >= 4);

    const bpd = out.measurements.find((m) => m.parameter === "bpd");
    assert.ok(bpd);
    assert.ok(bpd!.percentile != null);
    assert.ok(bpd!.percentile! >= 40 && bpd!.percentile! <= 60, "median BPD ~p50");
    assert.ok(out.efw);
    assert.ok(out.efw!.grams > 400);
    assert.ok(out.summaryRu.includes("22"));
  });

  it("flags small AC as borderline or below normal", () => {
    const out = assessFetalBiometry({
      gestationalAge: { weeks: 28 },
      acMm: 180,
      hcMm: 232,
      standard: "intergrowth",
    });

    const ac = out.measurements.find((m) => m.parameter === "ac");
    assert.ok(ac);
    assert.ok(ac!.percentile != null && ac!.percentile < 15);
    assert.ok(
      out.growthPattern === "asymmetric_head_spare" || out.recommendations.length >= 1,
    );
  });
});

describe("assessFetalBiometry — Hadlock", () => {
  it("uses Hadlock table for percentiles", () => {
    const out = assessFetalBiometry({
      gestationalAge: { weeks: 24 },
      bpdMm: 59,
      hcMm: 220,
      acMm: 190,
      flMm: 43,
      standard: "hadlock",
    });

    assert.equal(out.standard, "hadlock");
    const bpd = out.measurements.find((m) => m.parameter === "bpd");
    assert.ok(bpd?.note?.includes("Hadlock"));
    assert.ok(bpd!.percentile != null);
  });
});

describe("assessFetalBiometry — EFW", () => {
  it("calculates EFW from Hadlock IV when not provided", () => {
    const out = assessFetalBiometry({
      gestationalAge: { weeks: 32 },
      bpdMm: 81,
      hcMm: 295,
      acMm: 285,
      flMm: 62,
    });

    assert.ok(out.efw);
    assert.ok(out.efw!.grams > 1500 && out.efw!.grams < 2500);
    assert.ok(out.efw!.formula.includes("Hadlock"));
  });
});
