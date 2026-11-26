import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLINICAL_ROOMS, getClinicalRoomByHref } from "./rooms";

describe("clinical-rooms", () => {
  it("includes wave-1 consensus rooms", () => {
    assert.equal(CLINICAL_ROOMS.length, 4);
    const ids = CLINICAL_ROOMS.map((r) => r.id).sort();
    assert.deepEqual(ids, ["acr-rads", "figo-uterus", "fmf", "orads-us"]);
  });

  it("resolves room by href", () => {
    assert.equal(getClinicalRoomByHref("/tools/fmf")?.id, "fmf");
    assert.equal(getClinicalRoomByHref("/tools/rads")?.id, "acr-rads");
  });
});