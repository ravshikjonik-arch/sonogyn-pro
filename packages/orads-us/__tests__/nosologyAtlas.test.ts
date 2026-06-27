import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getOradsNosologyBySubtype,
  isOradsNosologyPending,
  ORADS_NOSOLOGY_ATLAS,
  ORADS_NOSOLOGY_PENDING_SUBTYPES,
  resolveOradsNosologyImageUri,
} from "../education/nosologyAtlas";

describe("nosologyAtlas", () => {
  it("maps four ready subtypes with unique ids", () => {
    assert.equal(ORADS_NOSOLOGY_ATLAS.length, 4);
    const ids = new Set(ORADS_NOSOLOGY_ATLAS.map((e) => e.id));
    assert.equal(ids.size, 4);
  });

  it("resolves functional cyst by subtype", () => {
    const entry = getOradsNosologyBySubtype("simple_cyst");
    assert.ok(entry);
    assert.match(entry.protocolText, /30×30/);
    assert.match(entry.imageSrc, /functional-cyst\.png$/);
  });

  it("flags pending subtypes without atlas entries", () => {
    for (const subtype of ORADS_NOSOLOGY_PENDING_SUBTYPES) {
      assert.equal(getOradsNosologyBySubtype(subtype), undefined);
      assert.equal(isOradsNosologyPending(subtype), true);
    }
  });

  it("builds absolute image uri from web base", () => {
    const uri = resolveOradsNosologyImageUri("/clinical/orads-nosology/functional-cyst.png", "https://sonogyn-pro.ru");
    assert.equal(uri, "https://sonogyn-pro.ru/clinical/orads-nosology/functional-cyst.png");
  });
});
