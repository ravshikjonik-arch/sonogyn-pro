import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  derivePregnancyTrimester,
  formatGestationalAgeRu,
  resolveObstetricSummary,
  initialPregnancyObstetricContext,
} from "./obstetricContext";

describe("pregnancy obstetric context (stage B)", () => {
  it("derives trimester boundaries", () => {
    assert.equal(derivePregnancyTrimester(null, null), null);
    assert.equal(derivePregnancyTrimester(0, 0), 1);
    assert.equal(derivePregnancyTrimester(13, 6), 1);
    assert.equal(derivePregnancyTrimester(14, 0), 2);
    assert.equal(derivePregnancyTrimester(27, 6), 2);
    assert.equal(derivePregnancyTrimester(28, 0), 3);
    assert.equal(derivePregnancyTrimester(40, 0), 3);
  });

  it("formats GA and summary", () => {
    assert.equal(formatGestationalAgeRu(12, 3), "12+3 нед.");
    const summary = resolveObstetricSummary({
      ...initialPregnancyObstetricContext,
      gestationalWeeks: 22,
      gestationalDays: 1,
    });
    assert.equal(summary.trimester, 2);
    assert.equal(summary.gaLabel, "22+1 нед.");
    assert.equal(summary.trimesterLabel, "II триместр");
  });
});
