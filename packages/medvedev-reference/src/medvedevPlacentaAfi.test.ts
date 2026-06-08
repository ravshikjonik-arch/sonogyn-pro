import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessMedvedevPlacentaAfi,
  getAfiReferenceBand,
  getPlacentaThicknessReferenceBand,
  getFingerLengthReferenceBand,
} from "./medvedevPlacentaAfi";

describe("medvedevPlacentaAfi", () => {
  it("returns AFI band at 32 weeks (Прил. 35)", () => {
    const band = getAfiReferenceBand(32);
    assert.ok(band);
    assert.equal(band!.p50, 144);
  });

  it("flags low AFI at 33 weeks (oligo)", () => {
    const rows = assessMedvedevPlacentaAfi({ gaWeeksByLmp: 33, afiCm: 4.2 });
    const afi = rows.find((r) => r.marker === "afi");
    assert.equal(afi?.flag, "low");
  });

  it("returns placenta thickness at 30 weeks (Прил. 34)", () => {
    const band = getPlacentaThicknessReferenceBand(30);
    assert.ok(band?.p50 != null && Math.abs(band.p50 - 35.32) < 0.01);
  });

  it("returns finger II band at 20 weeks (Прил. 33)", () => {
    const band = getFingerLengthReferenceBand("fingerII", 20);
    assert.ok(band);
    assert.equal(band!.p50, 12.1);
  });
});
