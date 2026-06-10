import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { earlyPregnancyPrognosis, evaluateEarlyPregnancyRules } from "./early-pregnancy";

describe("evaluateEarlyPregnancyRules", () => {
  it("accepts normal yolk sac and ring", () => {
    const results = evaluateEarlyPregnancyRules({
      gest_sac_ring_mm: 2.5,
      yolk_sac_diameter_mm: 4,
      yolk_sac_count: 1,
      embryo_count: 1,
      yolk_sac_echogenicity: "anechoic",
      yolk_sac_shape: "round",
    });
    assert.equal(earlyPregnancyPrognosis(results), "normal");
  });

  it("flags large yolk sac", () => {
    const results = evaluateEarlyPregnancyRules({ yolk_sac_diameter_mm: 8 });
    assert.ok(results.some((r) => r.id === "yolk_sac_diameter_mm" && !r.ok));
  });
});
