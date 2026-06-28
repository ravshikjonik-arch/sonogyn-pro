import { describe, expect, it } from "vitest";

import {
  getMedvedevReferenceBand,
  percentileFromMedvedevBand,
  assessFirstTrimesterMedvedev,
} from "./medvedevFirstTrimester";

describe("medvedevFirstTrimester", () => {
  it("returns NT band for CRL 60 mm from appendix row 56-60", () => {
    const band = getMedvedevReferenceBand(60, "nt");
    expect(band).not.toBeNull();
    expect(band!.p50).toBeCloseTo(1.56, 2);
    expect(band!.p95).toBeCloseTo(2.34, 2);
  });

  it("flags NT above p95 at CRL 55 mm", () => {
    const markers = assessFirstTrimesterMedvedev({ crlMm: 55, ntMm: 2.5 });
    const nt = markers.find((m) => m.marker === "nt");
    expect(nt?.flag).toBe("high");
    expect(nt?.percentile).toBeGreaterThanOrEqual(95);
  });

  it("computes mid-range percentile between p5 and p95", () => {
    const band = { p5: 1.0, p50: 2.0, p95: 3.0 };
    expect(percentileFromMedvedevBand(2.0, band)).toBe(50);
    expect(percentileFromMedvedevBand(1.0, band)).toBe(5);
    expect(percentileFromMedvedevBand(3.0, band)).toBe(95);
  });

  it("returns out_of_range when CRL below table", () => {
    const markers = assessFirstTrimesterMedvedev({ crlMm: 40, ntMm: 1.2 });
    expect(markers[0]?.flag).toBe("out_of_range");
  });
});
