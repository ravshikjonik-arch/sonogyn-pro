import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessBiometryMeasurement, assessEfwHadlockIv, assessAllBiometry } from "./biometry-engine";
import { assessSecondThirdScreening } from "./screening-engine";

describe("obstetric-engine biometry", () => {
  it("BPD at 20 weeks matches Medvedev p50", () => {
    const row = assessBiometryMeasurement("bpd", 48, 20, 0);
    assert.ok(row);
    assert.ok(Math.abs(row!.expected - 48) < 1);
    assert.ok(Math.abs(row!.percentile - 50) < 15);
  });

  it("flags low AC at 22 weeks", () => {
    const row = assessBiometryMeasurement("ac", 140, 22, 0);
    assert.ok(row);
    assert.ok(row!.percentile <= 10);
    assert.equal(row!.flag, "critical_low");
  });

  it("full screening with brain + EFW", () => {
    const out = assessSecondThirdScreening({
      gaWeeks: 22,
      gaDays: 0,
      bpdMm: 54,
      hcMm: 195,
      acMm: 169,
      flMm: 39,
      hlMm: 35,
      lateralVentriclesMm: 6.6,
      cisternaMagnaMm: 5.4,
      cerebellumMm: 23,
    });
    assert.ok(out.measurements.length >= 6);
    assert.ok(out.efw?.grams);
    assert.ok(out.skeletonIndices.some((i) => i.id === "fl_ac"));
  });
});
