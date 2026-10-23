import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NOMOGRAM_DECISION_TREE, NOMOGRAM_WIZARD_START, nextInputStepForNomogram } from "./nomogramDecisionTree";
import { listNomogramCategories } from "./dataset";

describe("nomogram decision tree", () => {
  it("starts at category step with all clinical blocks", () => {
    assert.equal(NOMOGRAM_WIZARD_START, "start_category");
    const opts = NOMOGRAM_DECISION_TREE.start_category.options ?? [];
    const cats = listNomogramCategories();
    for (const cat of cats) {
      assert.ok(opts.some((o) => o.category === cat), `missing category option ${cat}`);
    }
  });

  it("routes CRL nomograms to enter_crl", () => {
    assert.equal(nextInputStepForNomogram("crl_range_mm"), "enter_crl");
    assert.equal(nextInputStepForNomogram("ga_weeks"), "enter_ga");
  });
});
