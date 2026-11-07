import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLINICAL_ROOMS, ORADS_US_ROOM } from "./rooms";

describe("CLINICAL_ROOMS", () => {
  it("has unique room ids and hrefs", () => {
    const ids = CLINICAL_ROOMS.map((r) => r.id);
    const hrefs = CLINICAL_ROOMS.map((r) => r.href);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(hrefs).size, hrefs.length);
  });

  it("O-RADS US room has one primary calculator and no duplicate child hrefs", () => {
    const primaries = ORADS_US_ROOM.children.filter((c) => c.primary);
    assert.equal(primaries.length, 1);
    assert.equal(primaries[0]?.kind, "calculator");
    assert.equal(primaries[0]?.href, ORADS_US_ROOM.primaryHref);

    const childHrefs = ORADS_US_ROOM.children.map((c) => c.href);
    assert.equal(new Set(childHrefs).size, childHrefs.length);
  });

  it("room landing is not the same URL as the calculator", () => {
    assert.notEqual(ORADS_US_ROOM.href, ORADS_US_ROOM.primaryHref);
    assert.equal(ORADS_US_ROOM.href, "/tools/o-rads");
  });
});
