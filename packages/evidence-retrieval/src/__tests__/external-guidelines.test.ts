import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createMemoryCacheStore } from "../infra/cache.js";
import { whoAdapter } from "../adapters/external-guidelines.adapter.js";

describe("external guidelines adapter", () => {
  it("finds WHO pre-eclampsia seed by query", async () => {
    const result = await whoAdapter.search(
      { query: "pre-eclampsia prevention aspirin" },
      { config: {}, cache: createMemoryCacheStore() },
    );
    assert.equal(result.status, "ok");
    assert.ok(result.records.length >= 1);
    assert.match(result.records[0]!.title.toLowerCase(), /pre-eclampsia|preeclampsia/);
  });
});
