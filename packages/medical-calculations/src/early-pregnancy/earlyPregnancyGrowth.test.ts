import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessEarlyPregnancyGrowth,
  getEarlyReferenceBand,
} from "./engine";
import { expandPercentileBand, percentileFromBand } from "./percentiles";

describe("early pregnancy growth", () => {
  it("interpolates MSD band at 7+0", () => {
    const ref = getEarlyReferenceBand("msd", 49);
    assert.ok(ref);
    assert.equal(ref.gaLabel, "7+0");
    assert.equal(ref.band.p50, 30);
  });

  it("assesses CRL at 8+0", () => {
    const [crl] = assessEarlyPregnancyGrowth({ gaDays: 56, crlMm: 18 });
    assert.equal(crl?.parameter, "crl");
    assert.equal(crl?.percentile, 50);
    assert.equal(crl?.flag, "normal");
  });

  it("flags YSD critical high at 6 mm", () => {
    const [ysd] = assessEarlyPregnancyGrowth({ gaDays: 49, ysdMm: 6 });
    assert.equal(ysd?.flag, "critical_high");
    assert.match(ysd?.summary ?? "", /6 мм/);
  });

  it("flags YSD critical low below 2 mm", () => {
    const [ysd] = assessEarlyPregnancyGrowth({ gaDays: 42, ysdMm: 1.5 });
    assert.equal(ysd?.flag, "critical_low");
  });

  it("percentileFromBand mid-range", () => {
    const band = { p5: 10, p50: 20, p95: 30 };
    assert.equal(percentileFromBand(20, band), 50);
    assert.ok(percentileFromBand(15, band) > 5 && percentileFromBand(15, band) < 50);
  });

  it("expandPercentileBand orders percentiles", () => {
    const full = expandPercentileBand({ p5: 10, p50: 20, p95: 30 });
    assert.ok(full.p3 < full.p5);
    assert.ok(full.p97 > full.p95);
  });
});
