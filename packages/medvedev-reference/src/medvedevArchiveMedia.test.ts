import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getMedvedevArchiveImageByTableId,
  listMedvedevArchiveStructuredCards,
  medvedevArchiveBookStats,
} from "./medvedevArchiveMedia";

describe("medvedevArchiveMedia", () => {
  it("lists 96 structured cards with public image URLs", () => {
    const cards = listMedvedevArchiveStructuredCards();
    assert.equal(cards.length, 96);
    assert.ok(cards.every((c) => c.imageSrc.startsWith("/clinical/medvedev-archive/")));
    assert.ok(cards.every((c) => c.filename.endsWith(".jpeg")));
  });

  it("resolves image for table 2.17", () => {
    const src = getMedvedevArchiveImageByTableId("2.17");
    assert.ok(src?.includes("medvedev-archive"));
  });

  it("book stats cover all cards", () => {
    const s = medvedevArchiveBookStats();
    assert.equal(s.totalCards, 96);
    const sum = Object.values(s.byStatus).reduce((a, b) => a + b, 0);
    assert.equal(sum, 96);
  });
});
