import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateAdnex } from "./adnex";

/** ±0.5 percentage points — floating math vs published UI rounding. */
const PP = 0.005;

function assertAdnex(result: ReturnType<typeof calculateAdnex>) {
  assert.ok(result && "malignancyRisk" in result);
  return result;
}

describe("calculateAdnex", () => {
  it("probabilities sum to 1 within 0.1 pp", () => {
    const r = assertAdnex(
      calculateAdnex({
        ageYears: 45,
        oncologyCenter: true,
        maxDiameterMm: 80,
        maxSolidDiameterMm: 25,
        moreThan10Locules: false,
        papillaryCount: 2,
        acousticShadows: false,
        ascites: false,
        ca125Uml: 120,
      }),
    );
    const sum = Object.values(r.probabilities).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) <= 0.001);
  });

  it("without CA-125 selects no-CA-125 coefficients", () => {
    const r = assertAdnex(
      calculateAdnex({
        ageYears: 40,
        oncologyCenter: false,
        maxDiameterMm: 60,
        maxSolidDiameterMm: 10,
        moreThan10Locules: false,
        papillaryCount: 0,
        acousticShadows: true,
        ascites: false,
      }),
    );
    assert.equal(r.usedCa125, false);
  });

  it("golden: IOTA training screenshot ~81% malignancy (adnex-education OCR case)", () => {
    const r = assertAdnex(
      calculateAdnex({
        ageYears: 61,
        oncologyCenter: false,
        maxDiameterMm: 50,
        maxSolidDiameterMm: 45,
        moreThan10Locules: true,
        papillaryCount: 0,
        acousticShadows: false,
        ascites: true,
        ca125Uml: 20,
      }),
    );
    assert.ok(Math.abs(r.malignancyRisk - 0.8098) < PP);
    assert.ok(Math.abs(r.probabilities.benign - 0.1902) < PP);
  });

  it("low-risk unilocular with shadow stays below 10% malignancy", () => {
    const r = assertAdnex(
      calculateAdnex({
        ageYears: 35,
        oncologyCenter: false,
        maxDiameterMm: 40,
        maxSolidDiameterMm: 0,
        moreThan10Locules: false,
        papillaryCount: 0,
        acousticShadows: true,
        ascites: false,
      }),
    );
    assert.ok(r.malignancyRisk < 0.1);
  });

  it("CA-125 high increases malignancy vs same case without CA-125", () => {
    const base = {
      ageYears: 50,
      oncologyCenter: false,
      maxDiameterMm: 70,
      maxSolidDiameterMm: 15,
      moreThan10Locules: false,
      papillaryCount: 0 as const,
      acousticShadows: false,
      ascites: false,
    };
    const without = assertAdnex(calculateAdnex(base));
    const withCa = assertAdnex(calculateAdnex({ ...base, ca125Uml: 500 }));
    assert.ok(withCa.malignancyRisk > without.malignancyRisk);
    assert.equal(withCa.usedCa125, true);
  });

  it("rejects invalid solid > lesion", () => {
    const r = calculateAdnex({
      ageYears: 40,
      oncologyCenter: false,
      maxDiameterMm: 30,
      maxSolidDiameterMm: 35,
      moreThan10Locules: false,
      papillaryCount: 0,
      acousticShadows: false,
      ascites: false,
    });
    assert.ok("errors" in r);
  });
});
