import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateWizardTriangulation } from "./sreClassification";
import { mapOradsTreeToSreInput } from "./mapOradsTreeToSreInput";

describe("mapOradsTreeToSreInput", () => {
  it("includes IOTA codes from triangulation", () => {
    const path = [
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "simple" },
    ] as const;

    const result = {
      category: "O-RADS 2" as const,
      categoryNumber: 2 as const,
      riskPercent: "<1%",
      colorCode: "emerald" as const,
      managementKey: "orads.result.m2",
    };

    const tri = evaluateWizardTriangulation([...path], 2);
    const input = mapOradsTreeToSreInput([...path], result, ["simple cyst"], tri);

    assert.equal(input.domain, "adnex");
    assert.equal(input.classification?.oradsCategory, 2);
    assert.ok(Array.isArray(input.classification?.iotaBenignCodes));
    assert.equal(input.morphology?.localization, "ovarian");
    assert.equal(input.morphology?.structure, "unilocular");
  });
});
