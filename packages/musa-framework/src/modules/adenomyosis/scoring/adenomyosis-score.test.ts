import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateAdenomyosisScore } from "./adenomyosis-score";
import { generateAdenomyosisReport } from "../reports/adenomyosis-report";

describe("calculateAdenomyosisScore", () => {
  it("returns zero for empty input", () => {
    const r = calculateAdenomyosisScore({
      myometrialCysts: false,
      hyperechogenicIslands: false,
      subendometrialStriations: false,
      heterogeneousMyometrium: false,
      asymmetry: false,
      globularUterus: false,
      fanShapedShadowing: false,
    });
    assert.equal(r.total, 0);
    assert.equal(r.category, "low");
  });

  it("scores direct features at maximum weight", () => {
    const r = calculateAdenomyosisScore({
      myometrialCysts: true,
      hyperechogenicIslands: true,
      subendometrialStriations: true,
      jzThicknessMm: 14,
      heterogeneousMyometrium: true,
      asymmetry: true,
      globularUterus: true,
      fanShapedShadowing: true,
    });
    assert.equal(r.total, 13);
    assert.equal(r.category, "highly_probable");
  });
});

describe("generateAdenomyosisReport", () => {
  it("includes score and localization", () => {
    const report = generateAdenomyosisReport({
      myometrialCysts: true,
      hyperechogenicIslands: false,
      subendometrialStriations: true,
      jzThicknessMm: 14,
      heterogeneousMyometrium: false,
      asymmetry: true,
      globularUterus: false,
      fanShapedShadowing: false,
      localization: ["PW"],
      depthOfInvasion: "A3",
      morphologicType: "D",
    });
    assert.match(report.structuredReport, /Sonogyn Adenomyosis Score/);
    assert.match(report.structuredReport, /Задняя стенка/);
    assert.equal(report.sonogynScore, 8);
  });
});
