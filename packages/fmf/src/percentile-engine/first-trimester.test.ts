import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessFirstTrimesterScreening } from "./first-trimester";
import { assessNtFromCrl } from "./engine";
import { buildPercentileBand, calculateMoM, percentileFromZ, zScoreFromValue } from "./math";

describe("fmf percentile engine", () => {
  it("NT MoM at CRL 55 mm", () => {
    const nt = assessNtFromCrl(55, 1.8);
    assert.ok(nt);
    assert.ok(nt.expected > 1 && nt.expected < 4);
    assert.ok(nt.mom > 0.4 && nt.mom < 2.5);
    assert.ok(Number.isFinite(nt.zScore));
  });

  it("full first trimester screening", () => {
    const out = assessFirstTrimesterScreening({
      gaDays: 84,
      gaWeeks: 12,
      crlMm: 55,
      ntMm: 1.6,
      fhrBpm: 165,
      dvPi: 1.05,
      uterinePiLeft: 1.5,
      uterinePiRight: 1.7,
      sbpMmHg: 120,
      dbpMmHg: 75,
      nasalBone: "present",
      tricuspidRegurg: "none",
      dvAWave: "positive",
    });
    assert.ok(out.measurements.length >= 5);
    assert.ok(out.categorical.length >= 2);
    assert.ok(out.uterinePiMean != null);
    assert.ok(out.mapMmHg != null);
  });

  it("math helpers", () => {
    assert.equal(calculateMoM(2, 1), 2);
    assert.equal(percentileFromZ(0), 50);
    assert.ok(Math.abs(zScoreFromValue(110, 100, 10) - 1) < 0.01);
    const band = buildPercentileBand(10, 2);
    assert.ok(band.p3 < band.p5 && band.p97 > band.p95);
  });
});
