import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getMedvedevReferenceBand,
  percentileFromMedvedevBand,
  assessFirstTrimesterMedvedev,
} from "./medvedevFirstTrimester";

describe("medvedevFirstTrimester", () => {
  it("returns NT band for CRL 60 mm from appendix row 56-60", () => {
    const band = getMedvedevReferenceBand(60, "nt");
    assert.ok(band);
    assert.ok(Math.abs(band!.p50 - 1.56) < 0.01);
    assert.ok(Math.abs(band!.p95 - 2.34) < 0.01);
  });

  it("flags NT above p95 at CRL 55 mm", () => {
    const markers = assessFirstTrimesterMedvedev({ crlMm: 55, ntMm: 2.5 });
    const nt = markers.find((m) => m.marker === "nt");
    assert.equal(nt?.flag, "high");
    assert.ok(nt?.percentile != null && nt.percentile >= 95);
  });

  it("computes mid-range percentile between p5 and p95", () => {
    const band = { p5: 1.0, p50: 2.0, p95: 3.0 };
    assert.equal(percentileFromMedvedevBand(2.0, band), 50);
    assert.equal(percentileFromMedvedevBand(1.0, band), 5);
    assert.equal(percentileFromMedvedevBand(3.0, band), 95);
  });

  it("returns out_of_range when CRL below table", () => {
    const markers = assessFirstTrimesterMedvedev({ crlMm: 40, ntMm: 1.2 });
    assert.equal(markers[0]?.flag, "out_of_range");
  });
});
