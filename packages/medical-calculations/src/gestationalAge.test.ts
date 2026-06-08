import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  gaDaysFromCrlMm,
  approximateGaDaysFromBiometry,
  combinedGaDaysFromBiometry,
} from "./gestationalAge";

describe("gestationalAge", () => {
  it("CRL formula returns plausible GA for 60mm CRL", () => {
    const days = gaDaysFromCrlMm(60);
    assert.ok(days);
    assert.ok(days! >= 70 && days! <= 100);
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
