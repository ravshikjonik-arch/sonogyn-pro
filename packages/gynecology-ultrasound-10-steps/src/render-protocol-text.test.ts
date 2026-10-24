import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateVolumeFormula } from "./compute";
import { renderProtocolText } from "./render-protocol-text";
import { createEmptyDraftState } from "./index";

describe("gynecology-ultrasound-10-steps", () => {
  it("computes uterus volume with coefficient 0.52", () => {
    const v = evaluateVolumeFormula("length * thickness * width * 0.52", {
      length: 50,
      thickness: 40,
      width: 30,
    });
    assert.equal(v, 50 * 40 * 30 * 0.52);
  });

  it("renders selected uterus position without empty placeholders", () => {
    const state = createEmptyDraftState();
    state.steps.uterus_general = {
      position: "ANTEFLEXIO",
      dimensions: { length: 50, thickness: 40, width: 30 },
    };
    const text = renderProtocolText(state);
    assert.match(text, /ANTEFLEXIO/);
    assert.doesNotMatch(text, /\{\{/);
  });
});
