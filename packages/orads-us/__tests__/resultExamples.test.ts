import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getOradsResultExamples } from "../education/resultExamples";
import type { OradsTreeResult } from "../src/types";

function result(categoryNumber: OradsTreeResult["categoryNumber"]): OradsTreeResult {
  return {
    category: `O-RADS ${categoryNumber}` as OradsTreeResult["category"],
    categoryNumber,
    riskPercent: "",
    managementKey: "",
    colorCode: "emerald",
  };
}

describe("getOradsResultExamples", () => {
  it("shows the three classic benign practice examples for classic <10 cm (O-RADS 2)", () => {
    const ids = getOradsResultExamples(
      [
        { nodeId: "step2_lesion_class", optionId: "nonsimple" },
        { nodeId: "step3_unilocular_classic", optionId: "classic" },
        { nodeId: "step3_classic_size", optionId: "lt10" },
      ],
      result(2),
    ).map((e) => e.id);
    assert.deepEqual(ids, ["hemorrhagic_cyst_reticular", "dermoid_cyst", "endometrioid_cyst"]);
  });

  it("does not show O-RADS 2 examples when the answers give another category", () => {
    const path = [
      { nodeId: "step2_lesion_class", optionId: "nonsimple" },
      { nodeId: "step3_unilocular_classic", optionId: "classic" },
      { nodeId: "step3_classic_size", optionId: "ge10" },
    ];
    assert.deepEqual(getOradsResultExamples(path, result(3)), []);
    assert.deepEqual(
      getOradsResultExamples([{ nodeId: "step2_lesion_class", optionId: "simple" }], result(1)),
      [],
    );
  });

  it("shows the simple / functional cyst example for an O-RADS 2 simple cyst", () => {
    const ids = getOradsResultExamples([{ nodeId: "step2_lesion_class", optionId: "simple" }], result(2)).map(
      (e) => e.id,
    );
    assert.deepEqual(ids, ["functional_cyst"]);
  });

  it("shows the O-RADS 5 gallery for any O-RADS 5 result", () => {
    const ids = getOradsResultExamples([{ nodeId: "step4_papillary_count", optionId: "ge4" }], result(5)).map(
      (e) => e.id,
    );
    assert.deepEqual(ids, ["orads5_ovarian_cancer"]);
  });

  it("skips entries without a published practice echogram", () => {
    assert.deepEqual(
      getOradsResultExamples([{ nodeId: "step1_extraovarian", optionId: "paraovarian" }], result(2)),
      [],
    );
  });
});
