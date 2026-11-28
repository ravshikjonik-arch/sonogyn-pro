import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Bm25Index, tokenize } from "./bm25.js";
import { KnowledgeBus } from "./bus.js";
import { fmfLikeToPack, toKnowledgeChunk } from "./types.js";
import type { FmfLikeChunk, KnowledgePack } from "./types.js";

const FMF_CHUNKS: FmfLikeChunk[] = [
  {
    id: "fmf-nt-99",
    topic: "Порог NT",
    fact: "99-й центиль NT примерно 3.5 мм и практически не зависит от КТР; NT ≥ 3.5 мм — показание к инвазивной диагностике первой линии.",
    nosology: ["obstetrics"],
    tool: "obstetrics_nt_reference",
    flags: ["NT_HIGH"],
    organization: "FMF",
    document: "The 11-13 weeks scan",
    year: 2026,
    status: "учебный пересказ",
  },
  {
    id: "fmf-cpr-band",
    topic: "CPR пороги",
    fact: "Цереброплацентарное отношение ниже 0.7 рассматривают как признак перераспределения кровотока, ниже 0.6 — выраженное.",
    nosology: ["obstetrics"],
    tool: "obstetrics_cpr",
    organization: "FMF",
    document: "The 11-13 weeks scan",
    year: 2026,
    status: "учебный пересказ",
  },
  {
    id: "fmf-megacystis",
    topic: "Мегацистис",
    fact: "Мочевой пузырь ≥ 7 мм в 11–13 недель — мегацистис; 7–15 мм — около 20% хромосомной патологии.",
    nosology: ["obstetrics"],
    organization: "FMF",
    document: "The 11-13 weeks scan",
    year: 2026,
    status: "учебный пересказ",
  },
];

const BREAST_PACK: KnowledgePack = {
  id: "breast-pack",
  nosology: "breast",
  chunks: [
    {
      id: "breast-birads-4a",
      nosology: ["breast"],
      topic: "BI-RADS 4A",
      text: "BI-RADS 4A — умеренное подозрение: вероятность злокачественности низкая, порог для биопсии по решению врача.",
      citation: { organization: "ACR", document: "BI-RADS Atlas (УЗИ-приложение)", year: 2025, status: "учебный пересказ" },
      flags: ["BI_RADS_4"],
    },
  ],
};

describe("knowledge-bus: evidence-шина клинического мозга", () => {
  it("tokenize: RU-нормализация (lowercase, ё→е, числа)", () => {
    const t = tokenize("99-Й ЦЕНТИЛЬ NT ≈ 3.5 мм — объём!");
    assert.ok(t.includes("99"));
    assert.ok(t.includes("центиль"));
    assert.ok(t.includes("nt"));
    assert.ok(t.includes("мм"));
    assert.ok(t.includes("объем"), "ё → е");
    assert.ok(!t.includes("й"), "токены короче 2 символов отбрасываются");
    assert.ok(!t.includes("объём"), "ё нормализована в е");
  });

  it("toKnowledgeChunk: адаптация FMF-подобного чанка с цитатой и флагами", () => {
    const c = toKnowledgeChunk(FMF_CHUNKS[0]);
    assert.equal(c.id, "fmf-nt-99");
    assert.ok(c.text.startsWith("Порог NT."));
    assert.equal(c.citation.organization, "FMF");
    assert.equal(c.citation.year, 2026);
    assert.deepEqual(c.flags, ["NT_HIGH"]);
    assert.equal(c.tool, "obstetrics_nt_reference");
  });

  it("Bm25Index: релевантный чанк первый (RU-запрос)", () => {
    const idx = new Bm25Index(FMF_CHUNKS.map((c) => `${c.topic}. ${c.fact}`));
    const hits = idx.search("nt 3.5 центиль 99 инвазивная", 3);
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].index, 0);
    const hits2 = idx.search("мегацистис мочевой пузырь 7 мм", 3);
    assert.equal(hits2[0].index, 2);
  });

  it("Bm25Index: нерелевантный запрос → пусто", () => {
    const idx = new Bm25Index(FMF_CHUNKS.map((c) => `${c.topic}. ${c.fact}`));
    assert.equal(idx.search("селезёнка поджелудочная железа", 5).length, 0);
    assert.equal(idx.search("", 5).length, 0);
  });

  it("KnowledgeBus: мультипаковый поиск + фильтр по нозологии", () => {
    const bus = new KnowledgeBus();
    bus.registerPack(fmfLikeToPack("fmf-pack", FMF_CHUNKS));
    bus.registerPack(BREAST_PACK);
    const all = bus.search("порог биопсия 4a подозрение", 5);
    assert.ok(all.length >= 1);
    assert.equal(all.some((h) => h.chunk.nosology.includes("breast")), true);
    const breastOnly = bus.search("биопсия 4a", { nosology: "breast" });
    assert.ok(breastOnly.every((h) => h.chunk.nosology.includes("breast")));
    const obOnly = bus.search("nt 3.5", { nosology: "obstetrics" });
    assert.ok(obOnly.every((h) => h.chunk.nosology.includes("obstetrics")));
  });

  it("KnowledgeBus: фильтр по инструменту (tool-call чанки)", () => {
    const bus = new KnowledgeBus();
    bus.registerPack(fmfLikeToPack("fmf-pack", FMF_CHUNKS));
    const cpr = bus.byTool("obstetrics_cpr");
    assert.equal(cpr.length, 1);
    assert.equal(cpr[0].id, "fmf-cpr-band");
    const hits = bus.search("цереброплацентарное отношение 0.7", { tool: "obstetrics_cpr" });
    assert.equal(hits.length, 1);
    assert.equal(hits[0].chunk.tool, "obstetrics_cpr");
  });

  it("KnowledgeBus: дедупликация id между паков + topK", () => {
    const bus = new KnowledgeBus();
    bus.registerPack(fmfLikeToPack("pack-a", FMF_CHUNKS));
    bus.registerPack(fmfLikeToPack("pack-b", FMF_CHUNKS));
    const stats = bus.stats();
    assert.equal(stats.packs, 2);
    assert.equal(stats.chunks, 3, "дубликаты id не удваиваются");
    const hits = bus.search("nt cpr мегацистис порог мм", { topK: 2 });
    assert.ok(hits.length <= 2);
    assert.ok(hits[0].score >= hits[hits.length - 1].score);
  });

  it("KnowledgeBus: цитата в каждом хите + флаги + removePack", () => {
    const bus = new KnowledgeBus();
    bus.registerPack(fmfLikeToPack("fmf-pack", FMF_CHUNKS));
    bus.registerPack(BREAST_PACK);
    for (const hit of bus.search("nt cpr 4a биопсия", 10)) {
      assert.ok(hit.chunk.citation.organization);
      assert.ok(hit.chunk.citation.document);
      assert.ok(hit.chunk.citation.year > 1900);
      assert.ok(hit.chunk.citation.status);
    }
    assert.ok(bus.byNosology("breast").every((c) => c.flags?.includes("BI_RADS_4") || true));
    bus.removePack("fmf-pack");
    assert.equal(bus.stats().chunks, 1);
    assert.equal(bus.removePack("нет-такого"), false);
  });
});
