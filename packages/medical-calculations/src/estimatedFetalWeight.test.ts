import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { efwHadlock4, efwShepard, estimateFetalWeight } from "./estimatedFetalWeight";

describe("estimatedFetalWeight", () => {
  it("Hadlock4 returns positive grams for typical 3rd trimester values", () => {
    const r = efwHadlock4({ bpdMm: 90, hcMm: 320, acMm: 300, flMm: 65 });
    assert.ok(r);
    assert.ok(r!.grams > 500 && r!.grams < 5000);
    assert.equal(r!.formula, "hadlock4_bpd_hc_ac_fl");
  });

  it("Shepard works with BPD only", () => {
    const r = efwShepard(85);
    assert.ok(r);
    assert.ok(r!.grams > 200);
  });

  it("estimateFetalWeight prefers Hadlock4 when all params present", () => {
    const r = estimateFetalWeight({ bpdMm: 88, hcMm: 310, acMm: 290, flMm: 62 });
    assert.ok(r);
    assert.equal(r!.formula, "hadlock4_bpd_hc_ac_fl");
  });
});
