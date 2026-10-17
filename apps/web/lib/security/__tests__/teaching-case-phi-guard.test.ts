import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessTeachingCasePhi } from "../teaching-case-phi-guard";

describe("assessTeachingCasePhi", () => {
  it("allows anonymized clinical description", () => {
    const r = assessTeachingCasePhi({
      title: "O-RADS 4 — однокамерная киста 32 мм",
      description: "Женщина 45 лет, перimenopause, без симптомов.",
      anatomy: "правый придаток",
      pathology: "простая киста",
    });
    assert.equal(r.ok, true);
  });

  it("blocks email in case title", () => {
    const r = assessTeachingCasePhi({
      title: "contact doctor@test.com",
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.reasons.includes("email"));
  });

  it("blocks phone in description", () => {
    const r = assessTeachingCasePhi({
      title: "Киста",
      description: "Позвонить +7 916 123 45 67",
    });
    assert.equal(r.ok, false);
  });
});
