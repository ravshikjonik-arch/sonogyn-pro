import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { medicalVaultAdapter } from "../adapters/medical-vault.adapter.js";
import { createMemoryCacheStore } from "../infra/cache.js";
import type { MedicalVaultSearchHit } from "../types.js";
import { formatVaultPages, mergeVaultHitsRrf } from "../vault-merge.js";

function hit(chunkId: string, score: number, extra: Partial<MedicalVaultSearchHit> = {}): MedicalVaultSearchHit {
  return {
    chunkId,
    sourceId: "s1",
    title: "КР",
    quote: `фрагмент ${chunkId}`,
    url: "#",
    score,
    ...extra,
  };
}

describe("mergeVaultHitsRrf", () => {
  it("does not let saturated FTS scores outrank semantic hits", () => {
    const semantic = [hit("sem-1", 0.83), hit("sem-2", 0.79)];
    const fts = [hit("fts-1", 1.0), hit("fts-2", 1.0)];
    const merged = mergeVaultHitsRrf(semantic, fts, 4);
    assert.deepEqual(
      merged.map((h) => h.chunkId),
      ["sem-1", "fts-1", "sem-2", "fts-2"],
    );
  });

  it("ranks a chunk found by both channels first", () => {
    const semantic = [hit("a", 0.9), hit("both", 0.75)];
    const fts = [hit("both", 0.4, { pageStart: 13, pageEnd: 13 }), hit("b", 0.3)];
    const merged = mergeVaultHitsRrf(semantic, fts, 3);
    assert.equal(merged[0]?.chunkId, "both");
    assert.equal(merged[0]?.score, 0.75, "semantic payload/score preferred");
    assert.equal(merged[0]?.pageStart, 13, "page filled from FTS hit");
  });

  it("dedupes repeated chunk ids within one list and respects limit", () => {
    const merged = mergeVaultHitsRrf([hit("x", 0.9), hit("x", 0.8)], [hit("y", 0.5)], 1);
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.chunkId, "x");
  });

  it("returns empty for limit 0", () => {
    assert.deepEqual(mergeVaultHitsRrf([hit("a", 1)], [], 0), []);
  });
});

describe("formatVaultPages", () => {
  it("formats single page and ranges", () => {
    assert.equal(formatVaultPages({ pageStart: 13, pageEnd: 13 }), "стр. 13");
    assert.equal(formatVaultPages({ pageStart: 13, pageEnd: 14 }), "стр. 13–14");
    assert.equal(formatVaultPages({ pageStart: 7 }), "стр. 7");
  });

  it("omits missing or zero pages", () => {
    assert.equal(formatVaultPages({}), undefined);
    assert.equal(formatVaultPages({ pageStart: 0, pageEnd: 0 }), undefined);
  });
});

describe("medical_vault adapter page locator", () => {
  it("appends page to section in the citation record", async () => {
    const result = await medicalVaultAdapter.search(
      { query: "препараты железа" },
      {
        config: {
          medicalVaultSearch: async () => [
            hit("c1", 0.6, { section: "Таблица 1", pageStart: 13, pageEnd: 13 }),
            hit("c2", 0.5),
          ],
        },
        cache: createMemoryCacheStore(),
      },
    );
    assert.equal(result.records[0]?.section, "Таблица 1 · стр. 13");
    assert.equal(result.records[1]?.section, undefined);
  });
});
