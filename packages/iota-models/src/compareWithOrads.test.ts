import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compareIotaRiskWithOrads, IOTA_ORADS_RISK_THRESHOLD } from "./compareWithOrads";

describe("compareIotaRiskWithOrads", () => {
  it("threshold is 10%", () => {
    assert.equal(IOTA_ORADS_RISK_THRESHOLD, 0.1);
  });

  it("concordant low", () => {
    const r = compareIotaRiskWithOrads(0.05, { categoryNumber: 2 });
    assert.equal(r.status, "concordant");
  });

  it("concordant high", () => {
    const r = compareIotaRiskWithOrads(0.35, { categoryNumber: 5 });
    assert.equal(r.status, "concordant");
  });

  it("discordant IOTA higher", () => {
    const r = compareIotaRiskWithOrads(0.25, { categoryNumber: 3 });
    assert.equal(r.status, "discordant_iota_higher");
  });

  it("discordant O-RADS higher", () => {
    const r = compareIotaRiskWithOrads(0.02, { categoryNumber: 4 });
    assert.equal(r.status, "discordant_orads_higher");
  });

  it("missing O-RADS", () => {
    const r = compareIotaRiskWithOrads(0.2, { categoryNumber: null });
    assert.equal(r.status, "missing_orads");
  });
});
