import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateCrownHeelLengthCmFromFl } from "./fetalCrownHeelLength.js";

describe("estimateCrownHeelLengthCmFromFl", () => {
  it("returns cm for typical FL at 20 weeks", () => {
    const v = estimateCrownHeelLengthCmFromFl(33);
    assert.ok(v != null && v > 20 && v < 35);
  });

  it("null for out-of-range FL", () => {
    assert.equal(estimateCrownHeelLengthCmFromFl(5), null);
    assert.equal(estimateCrownHeelLengthCmFromFl(undefined), null);
  });
});