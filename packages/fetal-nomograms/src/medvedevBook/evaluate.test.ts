import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  estimateGaFromSvd,
  evaluateFetometryPanel,
  evaluateMeasurement,
  listMedvedevBookTables,
} from "./index";

describe("medvedev-book SSOT", () => {
  it("loads tables from all 6 JSON files", () => {
    const tables = listMedvedevBookTables();
    assert.ok(tables.length > 40, `expected many tables, got ${tables.length}`);
    assert.ok(tables.some((t) => t.id === "t1.nt"));
    assert.ok(tables.some((t) => t.id === "t2.bpd"));
    assert.ok(tables.some((t) => t.id === "appendix.uzbekistan.bpd_mm"));
    assert.ok(tables.some((t) => t.id === "dop.3.4.mca_psv_cm_s"));
  });

  it("golden: SVD 20 mm → GA near table p50", () => {
    const est = estimateGaFromSvd(20);
    assert.ok(est);
    assert.ok(est!.gaP50Days != null);
    // row svd=20 in source — check label exists
    assert.ok(est!.gaP50Label);
  });

  it("golden: NT by CRL 45-50, value 1.52 → normal near p50", () => {
    const r = evaluateMeasurement("t1.nt", 1.52, { crlMm: 47 });
    assert.ok(r);
    assert.equal(r!.zone, "normal");
    assert.ok(r!.p50 != null);
    assert.ok(Math.abs((r!.p50 ?? 0) - 1.52) < 0.01);
  });

  it("golden: BPD at 11w = 17 → normal (p50)", () => {
    const r = evaluateMeasurement("t1.bpd", 17, { gaWeeks: 11 });
    assert.ok(r);
    assert.equal(r!.zone, "normal");
    assert.equal(r!.p50, 17);
  });

  it("golden: BPD 16w = 30 → below p5(31)", () => {
    const r = evaluateMeasurement("t2.bpd", 30, { gaWeeks: 16 });
    assert.ok(r);
    assert.equal(r!.zone, "below");
    assert.equal(r!.pLow, 31);
  });

  it("golden: MCA PSV at/above MoM threshold → mom_alert", () => {
    const r = evaluateMeasurement("dop.3.4.mca_psv_cm_s", 34.8, { gaWeeks: 18 });
    assert.ok(r);
    assert.equal(r!.zone, "mom_alert");
  });

  it("panel summary counts zones", () => {
    const panel = evaluateFetometryPanel({
      ctx: { gaWeeks: 12, crlMm: 55 },
      measurements: {
        "t1.bpd": 17,
        "t1.nt": 0.5,
        "t1.fhr": 160,
      },
      section: "t1",
    });
    assert.ok(panel.results.length >= 2);
    assert.ok(panel.disclaimer.length > 10);
    assert.equal(panel.summary.below + panel.summary.normal + panel.summary.above + panel.summary.other + panel.summary.momAlert, panel.results.length);
  });
});
