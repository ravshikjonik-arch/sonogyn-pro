/**
 * Полная матрица стратификации O-RADS US v2022 (категории 0–5, основные ветки).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { evaluateOradsUs2022 } from "./evaluateOradsUs2022";
import { initialOradsUs2022Input, type OradsUs2022Input } from "./types";

const calc = (patch: Partial<OradsUs2022Input>) =>
  evaluateOradsUs2022({ ...initialOradsUs2022Input, ...patch });

test("стратификация: все категории 0–5 достижимы", () => {
  const samples: Array<{ label: string; patch: Partial<OradsUs2022Input>; category: number | null }> = [
    { label: "0", patch: { incomplete: true }, category: 0 },
    { label: "1 normal", patch: { morphology: "normal" }, category: 1 },
    { label: "1 simple ≤3 pre", patch: { morphology: "unilocular", menopause: "pre", sizeCm: 2.5, cystContent: "simple" }, category: 1 },
    { label: "2 bilocular", patch: { morphology: "bilocular", sizeCm: 4 }, category: 2 },
    { label: "2 classic dermoid", patch: { morphology: "classic", classicType: "dermoid", sizeCm: 5 }, category: 2 },
    { label: "3 simple 10cm", patch: { morphology: "unilocular", menopause: "pre", sizeCm: 10, cystContent: "simple" }, category: 3 },
    { label: "3 solid CS1", patch: { morphology: "solid", sizeCm: 4, colorScore: 1, outerContour: "smooth" }, category: 3 },
    { label: "4 uni solid", patch: { morphology: "unilocular", sizeCm: 5, solidComponent: true, papillae: "1-3" }, category: 4 },
    { label: "4 multiloc CS2+solid", patch: { morphology: "multilocular", sizeCm: 5, solidComponent: true, colorScore: 2 }, category: 4 },
    {
      label: "5 ascites upgrades 3",
      patch: { morphology: "unilocular", sizeCm: 4, innerContour: "irregular", extraSigns: "ascites" },
      category: 5,
    },
    { label: "5 pap 4+", patch: { morphology: "unilocular", sizeCm: 5, solidComponent: true, papillae: "4+" }, category: 5 },
    { label: "5 solid irregular", patch: { morphology: "solid", sizeCm: 3, outerContour: "irregular" }, category: 5 },
  ];

  for (const row of samples) {
    assert.equal(calc(row.patch).category, row.category, row.label);
  }
});

test("стратификация: ветка переклассификации геморрагической в postLate", () => {
  const r = calc({
    morphology: "classic",
    classicType: "hemorrhagic",
    sizeCm: 4,
    menopause: "postLate",
  });
  assert.equal(r.category, null);
  assert.ok(r.warning);
});
