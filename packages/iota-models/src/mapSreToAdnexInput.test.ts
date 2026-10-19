import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AdnexStructuredReportInput } from "@repo/types";

import { mapSreToAdnexInput } from "./mapSreToAdnexInput";

const base: AdnexStructuredReportInput = {
  domain: "adnex",
  measurements: { lengthMm: 50, widthMm: 40 },
  morphology: {
    structure: "multilocular",
    solidComponent: true,
    largestSolidDiameterMm: 45,
    ascites: true,
    menopause: "post",
    papillaryProjectionCount: "0",
  },
  classification: { oradsCategory: 5, iotaBenignCodes: [], iotaMalignantCodes: [] },
};

describe("mapSreToAdnexInput", () => {
  it("maps max diameter and solid from SRE morphology", () => {
    const partial = mapSreToAdnexInput(base);
    assert.equal(partial.maxDiameterMm, 50);
    assert.equal(partial.maxSolidDiameterMm, 45);
    assert.equal(partial.ascites, true);
    assert.equal(partial.moreThan10Locules, false);
  });

  it("infers postmenopause default age when not overridden", () => {
    assert.equal(mapSreToAdnexInput(base).ageYears, 58);
    assert.equal(mapSreToAdnexInput({ ...base, morphology: { ...base.morphology, menopause: "pre" } }).ageYears, 42);
  });

  it("detects >10 locules from navigator path heuristics", () => {
    const withPath = {
      ...base,
      navigatorPath: [{ nodeId: "locules", optionId: "more_than_10" }],
    };
    assert.equal(mapSreToAdnexInput(withPath).moreThan10Locules, true);
  });
});
