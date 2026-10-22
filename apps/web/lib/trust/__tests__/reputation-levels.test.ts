import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveReputationLevel } from "../reputation-levels.js";

describe("resolveReputationLevel", () => {
  it("maps score bands to Russian labels", () => {
    assert.equal(resolveReputationLevel(0).id, "novice");
    assert.equal(resolveReputationLevel(49).id, "novice");
    assert.equal(resolveReputationLevel(50).id, "practitioner");
    assert.equal(resolveReputationLevel(199).id, "practitioner");
    assert.equal(resolveReputationLevel(200).id, "expert");
    assert.equal(resolveReputationLevel(500).id, "authority");
  });
});
