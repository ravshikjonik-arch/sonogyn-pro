import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getOradsCategoryPhotoCards,
  listOradsCategoryPhotoCards,
  ORADS_ACR_CATEGORY_META,
  parseOradsCategoryFromHint,
} from "../education/categoryPhotoCards";

describe("categoryPhotoCards", () => {
  it("parses category from nosology hint", () => {
    assert.equal(parseOradsCategoryFromHint("O-RADS 2 · типичный дермоид"), 2);
    assert.equal(parseOradsCategoryFromHint("O-RADS 5 · высокий риск"), 5);
    assert.equal(parseOradsCategoryFromHint("Модификатор · асцит"), null);
  });

  it("keeps ACR ROM ranges from Table 2", () => {
    assert.equal(ORADS_ACR_CATEGORY_META[0].rom, "N/A");
    assert.equal(ORADS_ACR_CATEGORY_META[1].rom, "0%");
    assert.equal(ORADS_ACR_CATEGORY_META[2].rom, "<1%");
    assert.equal(ORADS_ACR_CATEGORY_META[3].rom, "1–<10%");
    assert.equal(ORADS_ACR_CATEGORY_META[4].rom, "10–<50%");
    assert.equal(ORADS_ACR_CATEGORY_META[5].rom, "≥50%");
  });

  it("keeps classic benign examples in O-RADS 2", () => {
    const cards = getOradsCategoryPhotoCards(2);
    const titles = cards.map((card) => card.titleRu).join(" ");
    assert.match(titles, /дермоид/i);
    assert.match(titles, /геморрагическ/i);
    assert.match(titles, /эндометрио/i);
    assert.ok(cards.some((card) => card.group === "classic-benign" && card.subtype === "dermoid"));
    assert.ok(cards.every((card) => card.category === 2));
  });

  it("places 1–3 papillary projections in O-RADS 4 and ≥4 in O-RADS 5", () => {
    const cat4 = getOradsCategoryPhotoCards(4)
      .map((card) => `${card.titleRu} ${card.acrLabelEn}`)
      .join(" ");
    const cat5 = getOradsCategoryPhotoCards(5)
      .map((card) => `${card.titleRu} ${card.acrLabelEn}`)
      .join(" ");

    assert.match(cat4, /<4 PPs|1–3 папилляр/i);
    assert.doesNotMatch(cat4, /≥4/);
    assert.match(cat5, /≥4 papillary|≥4 папилляр/i);
  });

  it("keeps high-risk ACR descriptors in O-RADS 5 without cancer-archetype titles", () => {
    const cards = getOradsCategoryPhotoCards(5);
    const titles = cards.map((card) => card.titleRu).join(" ");
    assert.match(titles, /≥4 папилляр/);
    assert.match(titles, /Асцит/);
    assert.match(titles, /неровн/i);
    assert.doesNotMatch(titles, /рак яичника/i);
    assert.ok(cards.some((card) => Boolean(card.imageSrc)));
  });

  it("covers all six categories without empty 0–5", () => {
    const all = listOradsCategoryPhotoCards();
    for (const category of [0, 1, 2, 3, 4, 5] as const) {
      assert.ok(
        all.some((card) => card.category === category),
        `missing cards for O-RADS ${category}`,
      );
    }
  });
});
