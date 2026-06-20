import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bishopScore } from "./bishop";
import { efwRudakov } from "./clinicalEfw";
import { datingFromFetalMovement } from "./pregnancyDating";

describe("bishopScore", () => {
  it("favorable when total >= 6", () => {
    const r = bishopScore({ dilation: 2, effacement: 2, station: 1, consistency: 1, position: 1 });
    assert.equal(r.total, 7);
    assert.equal(r.favorable, true);
  });
});

describe("efwRudakov", () => {
  it("returns grams for typical values", () => {
    const r = efwRudakov({ fundalHeightCm: 32, abdominalCircumferenceCm: 95, presentation: "cephalic" });
    assert.ok(r);
    assert.equal(r!.grams, (32 - 12) * 95);
  });
});

describe("datingFromFetalMovement", () => {
  it("estimates GA from quickening", () => {
    const mov = new Date("2026-01-01");
    const r = datingFromFetalMovement(mov, false);
    assert.ok(r.estimatedGaDays >= 140);
  });
});
