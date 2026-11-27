import { describe, expect, it } from "vitest";

import { getUsScanPlanesAtlas, listUsScanPlanesChapters } from "../src/index";

describe("us-scan-planes-atlas", () => {
  const doc = getUsScanPlanesAtlas();

  it("has 155 chapters and matching image count", () => {
    expect(doc.chapters).toHaveLength(155);
    expect(doc.meta.usImageCount).toBe(155);
    expect(doc.meta.chapterCount).toBe(155);
  });

  it("uses contiguous PDF pages 3–157 (no title/toc/outro)", () => {
    const pages = doc.chapters.map((c) => c.printStart).sort((a, b) => a - b);
    expect(pages[0]).toBe(3);
    expect(pages[pages.length - 1]).toBe(157);
    expect(new Set(pages).size).toBe(155);
  });

  it("filters sections by chapter.section", () => {
    for (const sec of doc.sections) {
      const list = listUsScanPlanesChapters(sec.id);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((c) => c.section === sec.id)).toBe(true);
    }
  });

  it("each chapter has one full-page scan asset href", () => {
    for (const ch of doc.chapters) {
      expect(ch.images).toHaveLength(1);
      const img = ch.images[0];
      expect(img.href).toMatch(/^\/clinical-atlas\/vetseva-scan-planes\/p\d{3}\.jpg$/);
      expect(img.modality).toBe("us+scheme");
    }
  });
});