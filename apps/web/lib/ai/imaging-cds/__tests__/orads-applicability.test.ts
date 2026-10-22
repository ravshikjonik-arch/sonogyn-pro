import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateOradsApplicability } from "@/lib/ai/imaging-cds/orads-applicability";

describe("orads-applicability", () => {
  it("blocks ectopic pregnancy context", () => {
    const r = evaluateOradsApplicability({ freeText: "внематочная беременность в трубе" });
    assert.equal(r.blockAnalysis, true);
    assert.equal(r.code, "ectopic_pregnancy");
  });

  it("blocks wrong modality mammography", () => {
    const r = evaluateOradsApplicability({ clinicalContext: "маммография BI-RADS" });
    assert.equal(r.code, "wrong_modality");
  });

  it("allows ovarian cyst context", () => {
    const r = evaluateOradsApplicability({ freeText: "яичник однокамерная киста 40 мм" });
    assert.equal(r.code, "ok");
    assert.equal(r.blockAnalysis, false);
  });
});
