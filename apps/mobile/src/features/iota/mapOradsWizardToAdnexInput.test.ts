import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateWizardTriangulation } from "@repo/report-engine";

import { mapOradsWizardToAdnexInput } from "./mapOradsWizardToAdnexInput";

describe("mapOradsWizardToAdnexInput", () => {
  it("maps wizard path to ADNEX prefill with O-RADS category context fields", () => {
    const path = [
      { nodeId: "step1_localization", optionId: "adnexal" },
      { nodeId: "step2_menopause", optionId: "post" },
      { nodeId: "step3_lesion", optionId: "cystic" },
    ] as const;
    const result = {
      category: "O-RADS 2" as const,
      categoryNumber: 2 as const,
      riskPercent: "<1%",
      managementKey: "orads.management.2",
      colorCode: "emerald" as const,
    };
    const tri = evaluateWizardTriangulation([...path], result.categoryNumber);
    const prefill = mapOradsWizardToAdnexInput([...path], result, ["киста"], tri);

    assert.equal(typeof prefill.ageYears, "number");
    assert.ok(prefill.ageYears! >= 18);
    assert.equal(typeof prefill.oncologyCenter, "boolean");
  });
});
