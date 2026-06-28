import { describe, expect, it } from "vitest";

import {
  assessSecondThirdMedvedev,
  calcPercentile,
  getMedvedevBiometryBand,
  listBiometryAtWeek,
} from "./medvedevBiometry";

describe("medvedevBiometry", () => {
  it("returns BPD band at 20 weeks from appendix 1", () => {
    const band = getMedvedevBiometryBand(20, "bpd");
    expect(band).not.toBeNull();
    expect(band!.p50).toBe(48);
    expect(band!.p95).toBe(53);
  });

  it("flags AC below p5 at 22 weeks", () => {
    const rows = assessSecondThirdMedvedev({
      gaWeeksByLmp: 22,
      gaDaysByLmp: 0,
      ac: 140,
    });
    const ac = rows.find((r) => r.marker === "ac");
    expect(ac?.flag).toBe("low");
    expect(ac?.percentile).toBeLessThanOrEqual(5);
  });

  it("lists all metrics for lookup at 30 weeks", () => {
    const rows = listBiometryAtWeek(30);
    expect(rows.length).toBeGreaterThan(8);
    expect(rows.find((r) => r.marker === "bpd")?.reference?.p50).toBe(78);
  });

  it("calcPercentile strict mode uses medvedev bands", () => {
    const pc = calcPercentile("bpd", 48, 20, 0, "strict");
    expect(pc).toBe(50);
  });
});
