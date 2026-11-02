import assert from "node:assert/strict";
import test from "node:test";

import {
  ORADS_BOOK_CATEGORIES,
  ORADS_BOOK_LEXICON,
  ORADS_BOOK_PHOTOCARDS,
  ORADS_BOOK_TUMOR_CARDS,
  getOradsBookCategory,
  getOradsBookTumorCard,
  getPhotocardsForTumor,
  listOradsBookLexiconTerms,
  listOradsBookTypicalBenign,
  listOradsBookTumorCards,
  searchOradsBookTumorCards,
} from "./index";

test("book ovary SSOT counts", () => {
  assert.equal(ORADS_BOOK_CATEGORIES.categories.length, 7);
  assert.equal(ORADS_BOOK_CATEGORIES.typical_benign.length, 6);
  assert.equal(ORADS_BOOK_CATEGORIES.orads_2022_principles.length, 9);
  assert.equal(listOradsBookLexiconTerms().length, 35);
  assert.equal(listOradsBookTumorCards().length, 32);
  assert.equal(ORADS_BOOK_PHOTOCARDS.cards.length, 47);
  assert.ok(ORADS_BOOK_LEXICON.color_score_scale["1"]);
});

test("numeric O-RADS categories 0–5 present with risk text", () => {
  for (const n of [0, 1, 2, 3, 4, 5]) {
    const cat = getOradsBookCategory(n);
    assert.ok(cat, `missing category ${n}`);
    if (n >= 1) assert.ok(cat.risk);
  }
});

test("tumor search finds endometrioma and markers", () => {
  const byName = searchOradsBookTumorCards("эндометриома");
  assert.ok(byName.some((t) => t.id === "endometrioma"));
  const byMarker = searchOradsBookTumorCards("СА-125");
  assert.ok(byMarker.length >= 1);
  assert.equal(getOradsBookTumorCard("dysgerminoma")?.name.includes("Дисгерминома"), true);
});

test("photocards link to tumor ids", () => {
  const cards = getPhotocardsForTumor("endometrioma");
  assert.ok(cards.length >= 1);
  assert.ok(cards.every((c) => c.file.endsWith(".jpg")));
});

test("typical benign names cover classic six", () => {
  const names = listOradsBookTypicalBenign().map((t) => t.name.toLowerCase());
  assert.ok(names.some((n) => n.includes("геморрагическ")));
  assert.ok(names.some((n) => n.includes("дермоид")));
  assert.ok(names.some((n) => n.includes("эндометриом")));
  assert.ok(names.some((n) => n.includes("параовариальн")));
  assert.ok(names.some((n) => n.includes("инклюзионн")));
  assert.ok(names.some((n) => n.includes("гидросальпинкс")));
});

test("tumor card ids unique", () => {
  const ids = ORADS_BOOK_TUMOR_CARDS.tumors.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});
