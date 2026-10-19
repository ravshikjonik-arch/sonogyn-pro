import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateLr2 } from "./lr2";

describe("calculateLr2", () => {
  it("caps solid diameter at 50 mm (JCO 2005)", () => {
    const a = calculateLr2({
      ageYears: 40,
      ascites: false,
      bloodFlowInSolidPapillary: false,
      maxSolidDiameterMm: 80,
      irregularInternalWalls: false,
      acousticShadows: false,
    });
    const b = calculateLr2({
      ageYears: 40,
      ascites: false,
      bloodFlowInSolidPapillary: false,
      maxSolidDiameterMm: 50,
      irregularInternalWalls: false,
      acousticShadows: false,
    });
    assert.ok("malignancyRisk" in a && "malignancyRisk" in b);
    assert.equal(a.malignancyRisk, b.malignancyRisk);
  });

  it("ascites and flow increase risk", () => {
    const low = calculateLr2({
      ageYears: 40,
      ascites: false,
      bloodFlowInSolidPapillary: false,
      maxSolidDiameterMm: 0,
      irregularInternalWalls: false,
      acousticShadows: true,
    });
    const high = calculateLr2({
      ageYears: 40,
      ascites: true,
      bloodFlowInSolidPapillary: true,
      maxSolidDiameterMm: 30,
      irregularInternalWalls: true,
      acousticShadows: false,
    });
    assert.ok("malignancyRisk" in low && "malignancyRisk" in high);
    assert.ok(high.malignancyRisk > low.malignancyRisk);
  });

  it("older age increases risk with otherwise benign features", () => {
    const young = calculateLr2({
      ageYears: 30,
      ascites: false,
      bloodFlowInSolidPapillary: false,
      maxSolidDiameterMm: 0,
      irregularInternalWalls: false,
      acousticShadows: true,
    });
    const older = calculateLr2({
      ageYears: 70,
      ascites: false,
      bloodFlowInSolidPapillary: false,
      maxSolidDiameterMm: 0,
      irregularInternalWalls: false,
      acousticShadows: true,
    });
    assert.ok("malignancyRisk" in young && "malignancyRisk" in older);
    assert.ok(older.malignancyRisk > young.malignancyRisk);
  });

  it("returns validation errors for out-of-range age", () => {
    const r = calculateLr2({
      ageYears: 10,
      ascites: false,
      bloodFlowInSolidPapillary: false,
      maxSolidDiameterMm: 0,
      irregularInternalWalls: false,
      acousticShadows: false,
    });
    assert.ok("errors" in r);
  });
});
