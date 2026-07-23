import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { combineBiradsCategories } from "./combine";
import { evaluateBiradsMmg } from "./evaluate";
import { defaultBiradsMmgInput } from "./options";

describe("evaluateBiradsMmg", () => {
  it("maps spiculated mass to BI-RADS 5", () => {
    const r = evaluateBiradsMmg({
      ...defaultBiradsMmgInput,
      findingType: "mass",
      massMargin: "spiculated",
      massShape: "irregular",
    });
    assert.equal(r.categoryCode, "5");
  });

  it("respects manual category", () => {
    const r = evaluateBiradsMmg({
      ...defaultBiradsMmgInput,
      biradsCategoryManual: "2",
      massMargin: "spiculated",
    });
    assert.equal(r.categoryCode, "2");
    assert.equal(r.suggestedAutomatically, false);
  });
});

describe("combineBiradsCategories", () => {
  it("picks higher suspicion", () => {
    const c = combineBiradsCategories({ usCategory: "BI-RADS 3", mmgCategory: "BI-RADS 4A" });
    assert.equal(c.suggestedCode, "4A");
  });

  it("forces 0 when either side incomplete", () => {
    const c = combineBiradsCategories({ usCategory: "0", mmgCategory: "5" });
    assert.equal(c.suggestedCode, "0");
    assert.equal(c.needsCompletion, true);
  });
});
