import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSeedNosologies } from "./nosologyStore";
import { searchNosologies } from "./search";
import { applyProtocolTemplate, buildProtocolInsertion } from "./templateInsert";

describe("searchNosologies", () => {
  const items = getSeedNosologies();

  it("returns all when query empty", () => {
    const hits = searchNosologies(items, "");
    assert.ok(hits.length >= 10);
  });

  it("finds myoma by keyword", () => {
    const hits = searchNosologies(items, "миома");
    assert.equal(hits[0]?.id, "uterine-myoma");
  });

  it("finds adenomyosis", () => {
    const hits = searchNosologies(items, "аденомиоз");
    assert.ok(hits.some((h) => h.id === "adenomyosis"));
  });
});

describe("templateInsert", () => {
  it("replaces placeholders", () => {
    const out = applyProtocolTemplate("Узел {размер} мм, {локализация}.", {
      размер: "42",
      локализация: "по передней стенке",
    });
    assert.match(out, /42/);
    assert.match(out, /передней стенке/);
  });

  it("buildProtocolInsertion keeps unknown placeholders", () => {
    const { diagnosis, conclusion } = buildProtocolInsertion(
      "Миома",
      "Размер {размер} мм.",
    );
    assert.equal(diagnosis, "Миома");
    assert.match(conclusion, /Размер — мм/);
  });
});
