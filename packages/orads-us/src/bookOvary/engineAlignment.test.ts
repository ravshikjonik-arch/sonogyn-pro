/**
 * Golden: сценарии из книги (CURSOR_PROMPT / orads_categories) ↔ evaluateOradsUs2022.
 * Движок не читает JSON напрямую — тест фиксирует совпадение стратификации.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { evaluateOradsUs2022 } from "../us2022/evaluateOradsUs2022";
import type { OradsUs2022Input } from "../us2022/types";
import { getOradsBookCategory, listOradsBookTypicalBenign } from "./index";

const base: OradsUs2022Input = {
  incomplete: false,
  menopause: "",
  cycleRegularity: "",
  morphology: "",
  classicType: "",
  sizeCm: null,
  cystContent: "simple",
  innerContour: "smooth",
  solidComponent: false,
  papillae: "0",
  colorScore: null,
  shadowing: false,
  outerContour: "smooth",
  extraSigns: "none",
};

const calc = (patch: Partial<OradsUs2022Input>) => evaluateOradsUs2022({ ...base, ...patch });

/** Сценарии из техзадания Kimi + правила категорий книги. */
const bookCases: Array<[string, Partial<OradsUs2022Input>, number | null]> = [
  ["простая киста 4 см, постменопауза → O-RADS 2", { morphology: "unilocular", sizeCm: 4, menopause: "postEarly", cystContent: "simple" }, 2],
  ["простая киста ≤3 см пременопауза → O-RADS 1 (фолликул)", { morphology: "unilocular", sizeCm: 3, menopause: "pre", cystContent: "simple" }, 1],
  ["солидное, неровный контур → O-RADS 5", { morphology: "solid", sizeCm: 5, outerContour: "irregular" }, 5],
  ["дермоид <10 см → O-RADS 2", { morphology: "classic", classicType: "dermoid", sizeCm: 6 }, 2],
  ["дермоид ≥10 см → O-RADS 3", { morphology: "classic", classicType: "dermoid", sizeCm: 10 }, 3],
  ["геморрагическая, поздняя постменопауза → переклассификация", { morphology: "classic", classicType: "hemorrhagic", sizeCm: 4, menopause: "postLate" }, null],
  ["многокамерная <10 см CS 1–3 → O-RADS 3", { morphology: "multilocular", sizeCm: 8, colorScore: 2 }, 3],
  ["однокамерная с 1–3 папиллярами → O-RADS 4", { morphology: "unilocular", sizeCm: 5, solidComponent: true, papillae: "1-3" }, 4],
  ["≥4 папилляра → O-RADS 5", { morphology: "unilocular", sizeCm: 5, solidComponent: true, papillae: "4+" }, 5],
  ["асцит при O-RADS 3 → 5", { morphology: "unilocular", sizeCm: 4, innerContour: "irregular", extraSigns: "ascites" }, 5],
];

for (const [name, input, expected] of bookCases) {
  test(`book↔engine: ${name}`, () => {
    assert.equal(calc(input).category, expected);
  });
}

test("book category risk strings match engine meta bands", () => {
  assert.match(String(getOradsBookCategory(2)?.risk), /<1/);
  assert.match(String(getOradsBookCategory(3)?.risk), /1/);
  assert.match(String(getOradsBookCategory(4)?.risk), /10/);
  assert.match(String(getOradsBookCategory(5)?.risk), /50/);
});

test("book lists six typical benign used by classic branch", () => {
  assert.equal(listOradsBookTypicalBenign().length, 6);
});
