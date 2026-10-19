import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateSimpleRulesRisk } from "./simpleRulesRisk";
import { evaluateSimpleRules } from "./simpleRules";

const PP = 0.005;

describe("Simple Rules Risk (AJOG 2016 Table 8)", () => {
  it("golden: B3+M2+M5 at oncology center → 92.3% (paper example)", () => {
    const r = calculateSimpleRulesRisk({
      oncologyCenter: true,
      benignFeatures: ["B3"],
      malignantFeatures: ["M2", "M5"],
    });
    assert.ok("malignancyRisk" in r);
    assert.ok(Math.abs(r.regressionScore - 2.49) < 0.01);
    assert.ok(Math.abs(r.malignancyRisk - 0.923) < PP);
  });
});

describe("evaluateSimpleRules", () => {
  it("benign when only B-features", () => {
    const r = evaluateSimpleRules({ benignFeatures: ["B1", "B5"], malignantFeatures: [] });
    assert.ok("verdict" in r && r.verdict === "benign");
  });
  it("malignant when only M-features", () => {
    const r = evaluateSimpleRules({ benignFeatures: [], malignantFeatures: ["M2"] });
    assert.ok("verdict" in r && r.verdict === "malignant");
  });
  it("inconclusive when mixed", () => {
    const r = evaluateSimpleRules({ benignFeatures: ["B1"], malignantFeatures: ["M1"] });
    assert.ok("verdict" in r && r.verdict === "inconclusive");
  });
});
