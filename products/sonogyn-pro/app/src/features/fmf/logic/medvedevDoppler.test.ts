import { describe, expect, it } from "vitest";

import {
  assessMedvedevDoppler,
  getDvPiReference,
  getUterinePiReferenceBand,
} from "./medvedevDoppler";

describe("medvedevDoppler", () => {
  it("returns DV reference for 12+3 (87 days)", () => {
    const ref = getDvPiReference(87);
    expect(ref).not.toBeNull();
    expect(ref!.week).toBe(12);
    expect(ref!.day).toBe(3);
  });

  it("flags high DV PI above FMF max", () => {
    const rows = assessMedvedevDoppler({ gaDaysTotal: 84, dvPi: 1.4 });
    const dv = rows.find((r) => r.marker === "dvPi");
    expect(dv?.flag).toBe("high");
  });

  it("computes UtA percentile at 12 weeks", () => {
    const band = getUterinePiReferenceBand(12);
    expect(band?.p50).toBeCloseTo(1.75, 2);
    const rows = assessMedvedevDoppler({ gaDaysTotal: 84, uterinePiRight: 2.6 });
    const uta = rows.find((r) => r.marker === "uterinePiRight");
    expect(uta?.percentile).toBeGreaterThanOrEqual(90);
  });
});
