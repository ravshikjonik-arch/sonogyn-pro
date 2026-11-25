import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildProtocolFromPhraseIds, getPelvisMapSteps, PELVIS_MAP_DISCLAIMER } from "./content";

describe("pelvis-map content", () => {
  it("has ordered steps covering uterus and DIE compartments", () => {
    const steps = getPelvisMapSteps();
    assert.ok(steps.length >= 7);
    assert.equal(steps[0].id, "clinic");
    assert.ok(steps.some((s) => s.id === "uterus_adenomyosis"));
    assert.ok(steps.some((s) => s.id === "posterior_compartment"));
    assert.ok(steps.some((s) => s.id === "neighbors"));
  });

  it("builds protocol from selected phrases", () => {
    const text = buildProtocolFromPhraseIds(["adenomyosis_diffuse", "disclaimer_footer"]);
    assert.match(text, /ячеистая/);
    assert.match(text, /CDS/);
    assert.ok(text.includes(PELVIS_MAP_DISCLAIMER));
  });
});
