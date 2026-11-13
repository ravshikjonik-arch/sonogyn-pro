import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rcogAdapter } from "../adapters/rcog.adapter.js";
import { providersForCorpusMode, shelvesForCorpusMode } from "../corpus-mode.js";
import { createMemoryCacheStore } from "../infra/cache.js";
import type { RetrievalConfig } from "../types.js";

describe("rcog adapter + corpus", () => {
  it("maps rcog corpus to rcog provider only", () => {
    assert.deepEqual(providersForCorpusMode("rcog"), ["rcog"]);
    assert.deepEqual(shelvesForCorpusMode("rcog"), ["international"]);
  });

  it("finds Green-top SGA / FGR cards without PDF body", async () => {
    const config: RetrievalConfig = { maxRecordsPerProvider: 8 };
    const result = await rcogAdapter.search(
      { query: "SGA FGR doppler", corpusMode: "rcog" },
      { config, cache: createMemoryCacheStore() },
    );
    assert.equal(result.status, "ok");
    assert.ok(result.records.length >= 1);
    assert.equal(result.records[0]?.provider, "rcog");
    assert.match(result.records[0]?.title ?? "", /SGA|FGR|GTG/i);
    assert.ok(result.records[0]?.url?.includes("rcog.org.uk"));
  });

  it("returns empty for unrelated query", async () => {
    const config: RetrievalConfig = { maxRecordsPerProvider: 8 };
    const result = await rcogAdapter.search(
      { query: "zzzznotarealguideline999", corpusMode: "rcog" },
      { config, cache: createMemoryCacheStore() },
    );
    assert.equal(result.status, "ok");
    assert.equal(result.records.length, 0);
  });
});
