import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMemoryCacheStore } from "../infra/cache.js";
import { buildOutboundSourceLinks } from "../outbound-links.js";
import { grlsAdapter } from "../adapters/grls.adapter.js";
import { epistemonikosAdapter } from "../adapters/epistemonikos.adapter.js";
import { roszdravnadzorAdapter } from "../adapters/roszdravnadzor.adapter.js";
import { listWhatsNewFeed } from "../whats-new.js";

describe("buildOutboundSourceLinks", () => {
  it("builds DOI and title outbound links", () => {
    const links = buildOutboundSourceLinks({
      doi: "10.1000/test.doi",
      title: "Ovarian mass ultrasound",
    });
    const ids = links.map((l) => l.id);
    assert.ok(ids.includes("doi_resolver"));
    assert.ok(ids.includes("cochrane"));
    assert.ok(ids.includes("trip"));
    assert.ok(ids.includes("elibrary"));
    assert.ok(ids.includes("openalex"));
  });
});

describe("grlsAdapter", () => {
  it("matches seed МНН and returns ГРЛС url", async () => {
    const result = await grlsAdapter.search(
      { query: "аспирин беременность" },
      { config: {}, cache: createMemoryCacheStore() },
    );
    assert.equal(result.status, "ok");
    assert.ok(result.records.length >= 1);
    assert.equal(result.records[0]?.provider, "grls");
    assert.match(result.records[0]?.url ?? "", /grls\.rosminzdrav\.ru/);
  });
});

describe("epistemonikos + roszdravnadzor + whats-new", () => {
  it("returns outbound epistemonikos cards", async () => {
    const result = await epistemonikosAdapter.search(
      { query: "preeclampsia aspirin" },
      { config: {}, cache: createMemoryCacheStore() },
    );
    assert.equal(result.status, "ok");
    assert.ok(result.records.some((r) => r.url.includes("epistemonikos.org")));
  });

  it("returns roszdravnadzor seed", async () => {
    const result = await roszdravnadzorAdapter.search(
      { query: "качество" },
      { config: {}, cache: createMemoryCacheStore() },
    );
    assert.equal(result.status, "ok");
    assert.ok(result.records.length >= 1);
  });

  it("lists whats-new feed", () => {
    const items = listWhatsNewFeed(new Date("2026-11-04T12:00:00Z"));
    assert.ok(items.length >= 4);
    assert.ok(items.every((i) => i.url.startsWith("http")));
  });
});
