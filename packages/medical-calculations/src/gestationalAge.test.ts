import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  gaDaysFromCrlMm,
  gaDaysFromCrlTable,
  approximateGaDaysFromBiometry,
  combinedGaDaysFromBiometry,
} from "./gestationalAge";

describe("gestationalAge", () => {
  it("CRL formula returns plausible GA for 60mm CRL", () => {
    const days = gaDaysFromCrlMm(60);
    assert.ok(days);
    assert.ok(days! >= 70 && days! <= 100);
  });

  it("CRL table (Medvedev 1.2 p50) returns 80 days for 45.5 mm", () => {
    assert.equal(gaDaysFromCrlTable(45.5), 80);
    assert.equal(gaDaysFromCrlTable(45), 80);
  });

  it("BPD biometry GA in plausible range", () => {
    const days = approximateGaDaysFromBiometry("BPD", 85);
    assert.ok(days);
    assert.ok(days! >= 200 && days! <= 290);
  });

  it("combined GA median from multiple parameters", () => {
    const days = combinedGaDaysFromBiometry({ BPD: 85, FL: 62, AC: 290 });
    assert.ok(days);
    assert.ok(days! >= 200);
  });
});
