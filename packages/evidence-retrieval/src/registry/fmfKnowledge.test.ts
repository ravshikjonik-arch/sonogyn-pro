import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FMF_KNOWLEDGE_CHUNKS,
  FMF_SOURCE_DOCUMENT,
  fmfAttributionLine,
  fmfChunkById,
  fmfChunksByTopic,
  validateFmfChunks,
} from "./fmfKnowledge";

describe("fmf knowledge chunks", () => {
  it("набор непустой и без ошибок валидации (золотое правило)", () => {
    assert.ok(FMF_KNOWLEDGE_CHUNKS.length >= 20, `ожидалось ≥20 чанков, есть ${FMF_KNOWLEDGE_CHUNKS.length}`);
    assert.deepEqual(validateFmfChunks(), []);
  });

  it("каждый чанк несёт атрибуцию FMF со статусом документа", () => {
    for (const c of FMF_KNOWLEDGE_CHUNKS) {
      assert.equal(c.organization, "FMF");
      assert.match(c.document, /The 11-13 weeks scan/);
      assert.equal(c.status, "действующий");
      assert.equal(c.year, 2026);
    }
  });

  it("ключевые пороги присутствуют: NT 3.5, DV, TR >60 см/с, мегацистис 7 мм, CVS ≥11", () => {
    const all = FMF_KNOWLEDGE_CHUNKS.map((c) => c.fact).join(" ");
    assert.match(all, /3\.5 мм/);
    assert.match(all, /reversed a-wave|реверс/i);
    assert.match(all, /60 см\/с/);
    assert.match(all, /≥7 мм/);
    assert.match(all, /не раньше 11 нед/);
    assert.match(all, /не раньше 16 нед/);
  });

  it("lookup по id и теме работает", () => {
    const c = fmfChunkById("fmf-nt-35-escalation");
    assert.ok(c);
    assert.ok(c!.flags?.includes("NT_HIGH"));
    assert.ok(fmfChunksByTopic("ob/screening/nt-").length >= 3);
    assert.equal(fmfChunkById("нет-такого"), undefined);
  });

  it("строка атрибуции для ответов ассистента", () => {
    assert.match(fmfAttributionLine(), /FMF «The 11-13 weeks scan/);
    assert.match(fmfAttributionLine(), /2026, действующий/);
  });

  it("источник-документ закреплён за FMF из реестра", () => {
    assert.equal(FMF_SOURCE_DOCUMENT.organization, "FMF");
    assert.match(FMF_SOURCE_DOCUMENT.url, /fetalmedicine\.org/);
  });
});
