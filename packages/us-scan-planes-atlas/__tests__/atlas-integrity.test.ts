import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getUsScanPlanesAtlas, listUsScanPlanesChapters } from "../src/index";

describe("us-scan-planes-atlas", () => {
  const doc = getUsScanPlanesAtlas();

  it("has 155 chapters and matching image count", () => {
    assert.equal(doc.chapters.length, 155);
    assert.equal(doc.meta.usImageCount, 155);
    assert.equal(doc.meta.chapterCount, 155);
  });

  it("uses contiguous PDF pages 3–157 (no title/toc/outro)", () => {
    const pages = doc.chapters.map((c) => c.printStart).sort((a, b) => a - b);
    assert.equal(pages[0], 3);
    assert.equal(pages[pages.length - 1], 157);
    assert.equal(new Set(pages).size, 155);
  });

  it("filters sections by chapter.section", () => {
    for (const sec of doc.sections) {
      const list = listUsScanPlanesChapters(sec.id);
      assert.ok(list.length > 0);
      assert.ok(list.every((c) => c.section === sec.id));
    }
  });

  it("each chapter has one full-page scan asset href", () => {
    for (const ch of doc.chapters) {
      assert.equal(ch.images.length, 1);
      const img = ch.images[0];
      assert.match(img.href, /^\/clinical-atlas\/vetseva-scan-planes\/p\d{3}\.jpg$/);
      assert.equal(img.modality, "us+scheme");
    }
  });
});