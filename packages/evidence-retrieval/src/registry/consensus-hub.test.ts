import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildConsensusHubCards, resolveImplementation, resolvePrimaryHref } from "./consensus-hub";
import { registryClassificationByKey } from "./registry";

describe("consensus-hub", () => {
  it("builds hub cards for all registry classifications", () => {
    const cards = buildConsensusHubCards();
    assert.ok(cards.length >= 20);
    for (const c of cards) {
      assert.ok(c.key.length > 0);
      assert.ok(c.implementation.length > 0);
    }
  });

  it("resolves FMF anemia href", () => {
    const cl = registryClassificationByKey("mca-psv-anemia");
    assert.ok(cl);
    assert.equal(resolveImplementation(cl!), "live");
    assert.match(resolvePrimaryHref(cl!)!, /\/tools\/calc\/fmf/);
  });
});