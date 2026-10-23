import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateNomogram } from "./evaluateNomogram";

describe("evaluateNomogram", () => {
  it("interpolates BPD at fractional GA", () => {
    const r = evaluateNomogram({
      nomogramId: "bpd_16_40",
      gaWeeksDecimal: 24.5,
      value: 60,
    });
    assert.equal(r.ok, true);
    assert.equal(r.flag, "P5_P50");
    assert.ok(r.interpolated?.p5 != null && r.interpolated.p50 != null);
  });

  it("flags CRL axis out of range", () => {
    const r = evaluateNomogram({
      nomogramId: "nt_by_crl",
      gaWeeksDecimal: 12,
      crlMm: 999,
      value: 2,
    });
    assert.equal(r.ok, false);
    assert.equal(r.flag, "out_of_range");
  });

  it("MCA PSV uses MoM threshold", () => {
    const r = evaluateNomogram({
      nomogramId: "mca_psv_16_39",
      gaWeeksDecimal: 28,
      value: 999,
    });
    assert.equal(r.flag, "AT_OR_ABOVE_MOM_THRESHOLD");
  });
});
