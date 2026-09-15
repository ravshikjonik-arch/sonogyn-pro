import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isOradsFeatureResultReady } from "../feature-grid-ready";

describe("isOradsFeatureResultReady", () => {
  it("waits for menopause and lesion kind", () => {
    assert.equal(isOradsFeatureResultReady({}), false);
    assert.equal(isOradsFeatureResultReady({ menopause: "pre" }), false);
  });

  it("is ready for normal ovary", () => {
    assert.equal(isOradsFeatureResultReady({ menopause: "pre", lesionKind: "normal_ovary" }), true);
  });

  it("needs unilocular subtype before showing category", () => {
    assert.equal(
      isOradsFeatureResultReady({
        menopause: "pre",
        lesionKind: "nonphysiological",
        structure: "unilocular",
      }),
      false,
    );
    assert.equal(
      isOradsFeatureResultReady({
        menopause: "pre",
        lesionKind: "nonphysiological",
        structure: "unilocular",
        unilocularSubtype: "dermoid",
      }),
      true,
    );
  });
});
