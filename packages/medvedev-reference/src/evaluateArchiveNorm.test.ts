import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateArchiveNorm, listArchiveCalculatorCards, listArchiveTableParameters } from "./evaluateArchiveNorm";

describe("evaluateArchiveNorm", () => {
  it("lists 96 calculator cards without image fields", () => {
    const cards = listArchiveCalculatorCards();
    assert.equal(cards.length, 96);
    for (const c of cards) {
      assert.ok(c.tableId);
      assert.ok(c.titleRu);
      assert.equal("filename" in c, false);
      assert.equal("imagePath" in c, false);
    }
  });

  it("table 2.17 sylvian @ 20w matches archive JSON", () => {
    const out = evaluateArchiveNorm({
      tableId: "2.17",
      gaWeeks: 20,
      gaDays: 0,
      value: 5.85,
    });
    assert.equal(out.ok, true);
    assert.equal(out.percentile, 50);
    assert.equal(out.reference?.p50, 5.85);
  });

  it("table 2.45 aortic isthmus @ 18w", () => {
    const out = evaluateArchiveNorm({
      tableId: "2.45",
      gaWeeks: 18,
      gaDays: 0,
      value: 2.04,
    });
    assert.equal(out.ok, true);
    assert.equal(out.percentile, 50);
  });

  it("table 2.5 multi-param FL @ 16w", () => {
    const params = listArchiveTableParameters("2.5");
    assert.ok(params.some((p) => p.id === "fl"));
    const out = evaluateArchiveNorm({
      tableId: "2.5",
      parameterId: "fl",
      gaWeeks: 16,
      gaDays: 0,
      value: 20,
    });
    assert.equal(out.ok, true);
    assert.equal(out.percentile, 50);
  });

  it("table 1.10 FHR @ 10w", () => {
    const out = evaluateArchiveNorm({
      tableId: "1.10",
      gaWeeks: 10,
      gaDays: 0,
      value: 170,
    });
    assert.equal(out.ok, true);
    assert.equal(out.percentile, 50);
  });

  it("dating_inverse 1.1 MSD", () => {
    const out = evaluateArchiveNorm({
      tableId: "1.1",
      value: 8,
    });
    assert.equal(out.ok, true);
    assert.ok(out.gaUsed);
  });
});
