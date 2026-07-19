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
  it("maps seven ready atlas entries with unique ids", () => {
    assert.equal(ORADS_NOSOLOGY_ATLAS.length, 7);
    const ids = new Set(ORADS_NOSOLOGY_ATLAS.map((e) => e.id));
    assert.equal(ids.size, 7);
  });

  it("resolves functional cyst by subtype", () => {
    const entry = getOradsNosologyBySubtype("simple_cyst");
    assert.ok(entry);
    assert.match(entry.protocolText, /30×30/);
    assert.match(entry.imageSrc, /functional-cyst\.jpg$/);
  });

  it("resolves dermoid and hydrosalpinx echograms", () => {
    const dermoid = getOradsNosologyBySubtype("dermoid");
    assert.ok(dermoid);
    assert.match(dermoid.imageSrc, /dermoid-cyst\.jpg$/);
    const hydrosalpinx = getOradsNosologyBySubtype("hydrosalpinx");
    assert.ok(hydrosalpinx);
    assert.match(hydrosalpinx.imageSrc, /hydrosalpinx\.jpg$/);
  });

  it("resolves free fluid as an O-RADS risk modifier echogram", () => {
    const freeFluid = getOradsNosologyBySubtype("free_fluid");
    assert.ok(freeFluid);
    assert.match(freeFluid.oradsHint, /Модификатор/);
    assert.match(freeFluid.imageSrc, /free-fluid-pelvis\.jpg$/);
  });

  it("flags pending subtypes without atlas entries", () => {
    for (const subtype of ORADS_NOSOLOGY_PENDING_SUBTYPES) {
      assert.equal(getOradsNosologyBySubtype(subtype), undefined);
      assert.equal(isOradsNosologyPending(subtype), true);
    }
    assert.equal(isOradsNosologyPending("dermoid"), false);
    assert.equal(isOradsNosologyPending("hydrosalpinx"), false);
  });

  it("builds absolute image uri from web base", () => {
    const uri = resolveOradsNosologyImageUri("/clinical/orads-nosology/functional-cyst.jpg", "https://sonogyn-pro.ru");
    assert.equal(uri, "https://sonogyn-pro.ru/clinical/orads-nosology/functional-cyst.jpg");
  });
});
