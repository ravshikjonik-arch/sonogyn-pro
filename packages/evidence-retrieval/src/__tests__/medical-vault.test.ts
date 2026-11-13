import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { medicalVaultAdapter } from "../adapters/medical-vault.adapter.js";
import { createMemoryCacheStore } from "../infra/cache.js";

describe("medical_vault adapter", () => {
  it("skips when medicalVaultSearch is not configured", async () => {
    const result = await medicalVaultAdapter.search(
      { query: "O-RADS 3" },
      { config: {}, cache: createMemoryCacheStore() },
    );
    assert.equal(result.status, "skipped");
    assert.equal(result.records.length, 0);
  });

  it("maps vault hits to EvidenceRecord with quotes", async () => {
    const result = await medicalVaultAdapter.search(
      { query: "O-RADS 3 наблюдение" },
      {
        config: {
          medicalVaultSearch: async () => [
            {
              chunkId: "c1",
              sourceId: "s1",
              title: "УЗИ в гинекологии",
              organization: "МЗ РФ",
              year: 2024,
              section: "O-RADS",
              quote: "O-RADS 3: наблюдение по локальному протоколу",
              url: "https://example.com/kr",
              score: 0.91,
            },
          ],
        },
        cache: createMemoryCacheStore(),
      },
    );
    assert.equal(result.status, "ok");
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0]?.provider, "medical_vault");
    assert.match(result.records[0]?.quote ?? "", /O-RADS 3/);
  });
});
