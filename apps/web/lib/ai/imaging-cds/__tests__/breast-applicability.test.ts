import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateBreastApplicability } from "@/lib/ai/imaging-cds/breast-applicability";

describe("evaluateBreastApplicability", () => {
  it("blocks gynecology context", () => {
    const r = evaluateBreastApplicability({ clinicalContext: "O-RADS яичник 4 см" });
    assert.equal(r.blockAnalysis, true);
    assert.equal(r.code, "wrong_modality");
  });

  it("allows breast context", () => {
    const r = evaluateBreastApplicability({ freeText: "узи молочной железы, образование 12 мм" });
    assert.equal(r.applicable, true);
    assert.equal(r.code, "ok");
  });

  it("blocks QC block severity", () => {
    const r = evaluateBreastApplicability({
      qcIssues: [{ code: "too_small", severity: "block", messageRu: "Кадр слишком мал" }],
    });
    assert.equal(r.code, "inadequate_study");
  });
});
