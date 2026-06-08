import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessMedvedevDoppler,
  getDvPiReference,
  getUterinePiReferenceBand,
} from "./medvedevDoppler";

describe("medvedevDoppler", () => {
  it("returns DV reference for 12+3 (87 days)", () => {
    const ref = getDvPiReference(87);
    assert.ok(ref);
    assert.equal(ref!.week, 12);
    assert.equal(ref!.day, 3);
  });

  it("flags high DV PI above FMF max", () => {
    const rows = assessMedvedevDoppler({ gaDaysTotal: 84, dvPi: 1.4 });
    const dv = rows.find((r) => r.marker === "dvPi");
    assert.equal(dv?.flag, "high");
  });

  it("computes UtA percentile at 12 weeks", () => {
    const band = getUterinePiReferenceBand(12);
    assert.ok(band?.p50 != null && Math.abs(band.p50 - 1.75) < 0.01);
    const rows = assessMedvedevDoppler({ gaDaysTotal: 84, uterinePiRight: 2.6 });
    const uta = rows.find((r) => r.marker === "uterinePiRight");
    assert.ok(uta?.percentile != null && uta.percentile >= 90);
  });

  it("flags high UA RI at 32 weeks (Прил. 37)", () => {
    const rows = assessMedvedevDoppler({ gaDaysTotal: 32 * 7, uaRi: 0.78 });
    const ua = rows.find((r) => r.marker === "uaRi");
    assert.equal(ua?.flag, "high");
    assert.ok(ua?.percentile != null && ua.percentile >= 95);
  });

  it("flags high MCA PSV above 1.5 MoM at 32 weeks (Прил. 38)", () => {
    const rows = assessMedvedevDoppler({ gaDaysTotal: 32 * 7, mcaPsv: 70 });
    const psv = rows.find((r) => r.marker === "mcaPsv");
    assert.equal(psv?.flag, "high");
    assert.ok(psv?.mom != null && psv.mom > 1.5);
  });

  it("accepts normal MCA PSV at 30 weeks (Прил. 38)", () => {
    const rows = assessMedvedevDoppler({ gaDaysTotal: 30 * 7, mcaPsv: 42 });
    const psv = rows.find((r) => r.marker === "mcaPsv");
    assert.equal(psv?.flag, "normal");
    assert.ok(psv?.mom != null && psv.mom < 1.5);
  });
});
