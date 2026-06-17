import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { walkOradsDecisionTree } from "./treeWalker";

describe("O-RADS US v2022 decision tree", () => {
  it("typical parovarian → O-RADS 2", () => {
    const out = walkOradsDecisionTree([
      { nodeId: "step1_localization", optionId: "extraovarian" },
      { nodeId: "step1_extraovarian", optionId: "paraovarian" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 2);
  });

  it("physiologic follicle ≤3 cm → O-RADS 1", () => {
    const out = walkOradsDecisionTree([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "physiological" },
      { nodeId: "step2_physiological_size", optionId: "le3cm" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 1);
  });

  it("simple cyst postmenopause >5 cm → O-RADS 3", () => {
    const out = walkOradsDecisionTree([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "post" },
      { nodeId: "step2_lesion_class", optionId: "simple" },
      { nodeId: "step3_simple_wall", optionId: "typical" },
      { nodeId: "step3_simple_size", optionId: "post_gt5" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 3);
  });

  it("multilocular irregular without solid → O-RADS 4", () => {
    const out = walkOradsDecisionTree([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "nonsimple" },
      { nodeId: "step3_locularity", optionId: "multilocular" },
      { nodeId: "step3_multilocular_wall", optionId: "irregular" },
      { nodeId: "step3_multilocular_irregular_solid_gate", optionId: "no_solid" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 4);
  });

  it("unilocular irregular wall, nodule <3 mm → O-RADS 3", () => {
    const out = walkOradsDecisionTree([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "nonsimple" },
      { nodeId: "step3_locularity", optionId: "unilocular" },
      { nodeId: "step3_unilocular_wall", optionId: "irregular" },
      { nodeId: "step3_unilocular_irregular_nodule", optionId: "lt3mm" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 3);
  });

  it("unilocular ≥4 papillary projections → O-RADS 5", () => {
    const out = walkOradsDecisionTree([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "nonsimple" },
      { nodeId: "step3_locularity", optionId: "unilocular" },
      { nodeId: "step3_unilocular_wall", optionId: "smooth" },
      { nodeId: "step3_unilocular_classic", optionId: "non_classic" },
      { nodeId: "step3_unilocular_nonsimple_size", optionId: "lt10" },
      { nodeId: "step4_solid_presence", optionId: "present" },
      { nodeId: "step4_solid_height", optionId: "ge3mm" },
      { nodeId: "step4_papillary_count", optionId: "ge4" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 5);
  });

  it("predominantly solid irregular contour → O-RADS 5", () => {
    const out = walkOradsDecisionTree([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "post" },
      { nodeId: "step2_lesion_class", optionId: "solid" },
      { nodeId: "step4_solid_dominant_contour", optionId: "irregular" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 5);
  });
});
