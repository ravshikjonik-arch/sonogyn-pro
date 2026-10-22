import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getBookNosologyRegistry,
  listBookEntriesForSeedNosology,
  listBookNosologyEntries,
  searchBookNosologyEntries,
} from "./index";

describe("book-nosology-registry", () => {
  it("loads generated registry", () => {
    const reg = getBookNosologyRegistry();
    assert.ok(reg.entryCount >= 200);
    assert.ok((reg.prenatalFindingCount ?? 0) >= 100);
    assert.equal(reg.entries.length, reg.entryCount);
  });

  it("links cervix-pathology seed to morpho chapters", () => {
    const linked = listBookEntriesForSeedNosology("cervix-pathology");
    assert.ok(linked.length >= 4);
    assert.ok(linked.every((e) => e.bookId === "cervix-morpho"));
  });

  it("search finds prenatal heart chapter", () => {
    const hits = searchBookNosologyEntries("сердце");
    assert.ok(hits.some((h) => h.chapterSlug === "glava-15"));
  });

  it("clinical filter reduces reference chapters", () => {
    const all = listBookNosologyEntries().length;
    const clinical = listBookNosologyEntries({ clinicalOnly: true }).length;
    assert.ok(clinical < all);
    assert.ok(clinical >= 300);
  });
});
