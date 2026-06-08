import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessSecondThirdMedvedev,
  calcPercentile,
  getMedvedevBiometryBand,
  listBiometryAtWeek,
} from "./medvedevBiometry";

describe("medvedevBiometry", () => {
  it("returns BPD band at 20 weeks from appendix 1", () => {
    const band = getMedvedevBiometryBand(20, "bpd");
    assert.ok(band);
    assert.equal(band!.p50, 48);
    assert.equal(band!.p95, 53);
  });

  it("flags AC below p5 at 22 weeks", () => {
    const rows = assessSecondThirdMedvedev({
      gaWeeksByLmp: 22,
      gaDaysByLmp: 0,
      ac: 140,
    });
    const ac = rows.find((r) => r.marker === "ac");
    assert.equal(ac?.flag, "low");
    assert.ok(ac?.percentile != null && ac.percentile <= 5);
  });

  it("lists all metrics for lookup at 30 weeks", () => {
    const rows = listBiometryAtWeek(30);
    assert.ok(rows.length > 8);
    assert.equal(rows.find((r) => r.marker === "bpd")?.reference?.p50, 78);
  });

  it("calcPercentile strict mode uses medvedev bands", () => {
    const pc = calcPercentile("bpd", 48, 20, 0, "strict");
    assert.equal(pc, 50);
  });
});
