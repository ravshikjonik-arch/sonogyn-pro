import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getOradsNosologyBySubtype,
  getOradsNosologyPracticeImages,
  getOradsNosologyPreviewImage,
  isOradsNosologyPending,
  isOradsOwnCaseImage,
  ORADS_NOSOLOGY_ATLAS,
  ORADS_NOSOLOGY_PENDING_SUBTYPES,
  resolveOradsNosologyImageUri,
} from "../education/nosologyAtlas";

describe("nosologyAtlas", () => {
  it("maps ready atlas entries with unique ids", () => {
    assert.equal(ORADS_NOSOLOGY_ATLAS.length, 9);
    const ids = new Set(ORADS_NOSOLOGY_ATLAS.map((e) => e.id));
    assert.equal(ids.size, 9);
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

  it("resolves peritoneal inclusion from book photocard", () => {
    const entry = getOradsNosologyBySubtype("peritoneal_inclusion");
    assert.ok(entry);
    assert.match(entry.imageSrc, /orads-book\/photocards\/book4_p07_card1\.jpg$/);
    assert.equal(isOradsNosologyPending("peritoneal_inclusion"), false);
  });

  it("flags pending subtypes without atlas entries", () => {
    assert.equal(ORADS_NOSOLOGY_PENDING_SUBTYPES.length, 0);
    for (const subtype of ORADS_NOSOLOGY_PENDING_SUBTYPES) {
      assert.equal(getOradsNosologyBySubtype(subtype), undefined);
      assert.equal(isOradsNosologyPending(subtype), true);
    }
    assert.equal(isOradsNosologyPending("dermoid"), false);
    assert.equal(isOradsNosologyPending("hydrosalpinx"), false);
  });

  it("publishes only own-case echograms", () => {
    const functional = getOradsNosologyBySubtype("simple_cyst");
    assert.ok(functional);
    assert.deepEqual(getOradsNosologyPracticeImages(functional), [
      "/clinical/own-cases/orads/functional-cyst-real.jpg",
      "/clinical/own-cases/orads/functional-cyst-real-2.jpg",
    ]);
    assert.equal(getOradsNosologyPreviewImage(functional), "/clinical/own-cases/orads/functional-cyst-real.jpg");

    const cancer = getOradsNosologyBySubtype("orads5_ovarian_cancer");
    assert.ok(cancer);
    assert.equal(getOradsNosologyPracticeImages(cancer).length, 5);

    const paraovarian = getOradsNosologyBySubtype("paraovarian");
    assert.ok(paraovarian);
    assert.equal(getOradsNosologyPreviewImage(paraovarian), null);

    for (const entry of ORADS_NOSOLOGY_ATLAS) {
      for (const src of getOradsNosologyPracticeImages(entry)) {
        assert.ok(isOradsOwnCaseImage(src), src);
        assert.doesNotMatch(src, /orads-nosology|orads-book|clinical-atlas/);
      }
    }
  });

  it("builds absolute image uri from web base", () => {
    const uri = resolveOradsNosologyImageUri("/clinical/orads-nosology/functional-cyst.jpg", "https://sonogyn-pro.ru");
    assert.equal(uri, "https://sonogyn-pro.ru/clinical/orads-nosology/functional-cyst.jpg");
  });
});
