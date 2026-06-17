import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateOradsResult } from "./calculateOradsResult";
import { ORADS_TREE_OPTIONAL_ENTRY_ID, ORADS_TREE_ROOT_ID } from "./oradsDecisionTree";

describe("calculateOradsResult", () => {
  it("simple cyst premenopause 3–5 cm → O-RADS 2", () => {
    const out = calculateOradsResult([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "simple" },
      { nodeId: "step3_simple_wall", optionId: "typical" },
      { nodeId: "step3_simple_size", optionId: "pre_gt3_le5" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 2);
  });

  it("physiologic follicle ≤3 cm → O-RADS 1", () => {
    const out = calculateOradsResult([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "physiological" },
      { nodeId: "step2_physiological_size", optionId: "le3cm" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 1);
  });

  it("multilocular smooth with solid + high color score → O-RADS 5", () => {
    const out = calculateOradsResult([
      { nodeId: "step1_localization", optionId: "ovarian" },
      { nodeId: "step2_menopause", optionId: "pre" },
      { nodeId: "step2_lesion_class", optionId: "nonsimple" },
      { nodeId: "step3_locularity", optionId: "multilocular" },
      { nodeId: "step3_multilocular_wall", optionId: "smooth" },
      { nodeId: "step3_multilocular_solid_gate", optionId: "with_solid" },
      { nodeId: "step5_multilocular_solid_cs", optionId: "cs34" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 5);
  });

  it("unilocular ≥4 papillary projections → O-RADS 5", () => {
    const out = calculateOradsResult([
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

  it("technically inadequate → O-RADS 0 from optional entry", () => {
    const out = calculateOradsResult(
      [{ nodeId: ORADS_TREE_OPTIONAL_ENTRY_ID, optionId: "inadequate" }],
      ORADS_TREE_OPTIONAL_ENTRY_ID,
    );
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.categoryNumber, 0);
  });

  it("typical paraovarian cyst → O-RADS 2", () => {
    const out = calculateOradsResult([
      { nodeId: "step1_localization", optionId: "extraovarian" },
      { nodeId: "step1_extraovarian", optionId: "paraovarian" },
    ]);
    assert.equal(out.ok, true);
    if (out.ok) {
      assert.equal(out.result.categoryNumber, 2);
      assert.equal(out.result.path.length, 2);
    }
  });
});
