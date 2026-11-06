import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalCdf } from "@repo/fmf";

import { assessAllBiometry, assessEfwHadlockIv } from "./biometry-engine";
import type { SecondThirdScreeningInput } from "./types";

/** EFW percentile must follow the normal distribution of the engine's own z-score. Synthetic biometry only. */
function efwFor(input: SecondThirdScreeningInput) {
  const biometry = assessAllBiometry(input);
  return assessEfwHadlockIv(input, biometry);
}

const BASE: SecondThirdScreeningInput = { gaWeeks: 30, gaDays: 0, bpdMm: 77, hcMm: 280, acMm: 255, flMm: 57 };

describe("EFW percentile (Hadlock IV)", () => {
  it("percentile equals Φ(z)·100 (not a linear 50 + 34·z)", () => {
    for (const acMm of [215, 230, 245, 255, 265, 280, 295]) {
      const efw = efwFor({ ...BASE, acMm });
      assert.ok(efw, `EFW computed for AC ${acMm}`);
      const z = (efw.grams - efw.expected) / efw.sd;
      const expected = Math.max(0.1, Math.min(99.9, Math.round(normalCdf(z) * 1000) / 10));
      assert.equal(efw.percentile, expected, `AC ${acMm}: z=${z.toFixed(2)}`);
    }
  });

  it("growth category thresholds use the corrected percentile", () => {
    for (const acMm of [215, 230, 245, 255, 265, 280, 295]) {
      const efw = efwFor({ ...BASE, acMm })!;
      const expected = efw.percentile < 10 ? "sga" : efw.percentile > 90 ? "lga" : "aga";
      assert.equal(efw.growthCategory, expected, `AC ${acMm}`);
    }
  });

  it("z = 0 → 50th percentile", () => {
    const efw = efwFor(BASE)!;
    const z = (efw.grams - efw.expected) / efw.sd;
    if (Math.abs(z) < 0.02) assert.ok(Math.abs(efw.percentile - 50) <= 1);
    assert.ok(efw.percentile > 0 && efw.percentile < 100);
  });
});
