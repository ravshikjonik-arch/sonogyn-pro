import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildProtocolOneLiner,
  buildReportText,
  calculateORADS,
  isOradsFinal,
  oradsCategoryLabel,
  oradsFinalCategory,
} from "./oradsCalculator";
import type { OradsInput, OradsResult } from "./types";

const simpleCyst: OradsInput = {
  localization: "ovarian",
  menopause: "post",
  lesionKind: "nonphysiological",
  structure: "unilocular",
  unilocularSubtype: "simple_cyst",
};

function assertNoNumber(r: OradsResult) {
  assert.equal(r.category, null);
  assert.equal(isOradsFinal(r), false);
  assert.equal(oradsFinalCategory(r), null);
  for (const text of [oradsCategoryLabel(r), buildProtocolOneLiner(r)]) {
    assert.doesNotMatch(text, /O-RADS\s*[1-5]\b/, text);
  }
}

test("missing size: no category instead of a guessed O-RADS 3", () => {
  const r = calculateORADS(simpleCyst);
  assert.equal(r.status, "needs_data");
  assertNoNumber(r);
  assert.ok(r.missing.some((m) => /размер/i.test(m)), r.missing.join("; "));
  const report = buildReportText(simpleCyst, r);
  assert.match(report, /категория не определена/);
  assert.match(report, /Не хватает данных/);
  assert.doesNotMatch(report, /O-RADS\s*[1-5]\b/);
});

test("unknown lesion type: no category", () => {
  const r = calculateORADS({ localization: "ovarian", menopause: "pre" });
  assert.equal(r.status, "needs_data");
  assertNoNumber(r);
  assert.ok(r.missing.length > 0);
});

test("reclassification needed: no guessed O-RADS 4", () => {
  const r = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    ageYears: 62,
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "hemorrhagic",
    lengthMm: 40, widthMm: 32, heightMm: 28,
  });
  assert.equal(r.status, "reclassify");
  assertNoNumber(r);
});

test("O-RADS 0 is shown as O-RADS 0, not as 3", () => {
  const r: OradsResult = {
    status: "technically_incomplete",
    category: 0,
    missing: [],
    riskText: "Технически неполное исследование",
    recommendation: "Повторить исследование",
    rationale: "",
    volumeMl: null,
  };
  assert.equal(oradsCategoryLabel(r), "O-RADS 0");
  assert.equal(oradsFinalCategory(r), null);
  assert.doesNotMatch(buildProtocolOneLiner(r), /O-RADS\s*[1-5]\b/);
});

test("no category without all three dimensions, for every lesion type", () => {
  const solidIrregular: OradsInput = {
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "solid",
    solidComponent: true,
    solidType: "irregular",
    iotaColorScore: "3",
  };
  const normalOvary: OradsInput = { localization: "ovarian", menopause: "pre", lesionKind: "normal_ovary" };
  const dermoid: OradsInput = { ...simpleCyst, unilocularSubtype: "dermoid" };
  for (const base of [solidIrregular, normalOvary, dermoid, simpleCyst]) {
    for (const dims of [{}, { lengthMm: 44.2 }, { lengthMm: 44.2, widthMm: 39.4 }]) {
      const r = calculateORADS({ ...base, ...dims });
      assert.equal(r.status, "needs_data", JSON.stringify({ ...base, ...dims }));
      assertNoNumber(r);
      assert.match(r.missing[0], /три размера/);
    }
    const full = calculateORADS({ ...base, lengthMm: 44.2, widthMm: 39.4, heightMm: 42.9 });
    assert.notEqual(full.missing[0] ?? "", "три размера");
  }
  const twoOfThree = calculateORADS({ ...simpleCyst, lengthMm: 44.2, heightMm: 42.9 });
  assert.match(twoOfThree.missing[0], /нет: ширина$/);
});

test("blood flow fills the colour score only when CS was not chosen", () => {
  const solidSmooth: OradsInput = {
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "solid",
    solidComponent: true,
    solidType: "smooth",
    lengthMm: 44.2,
    widthMm: 39.4,
    heightMm: 42.9,
  };
  const noFlow = calculateORADS(solidSmooth);
  assert.equal(noFlow.status, "needs_data");
  assert.ok(noFlow.missing.some((m) => /цветов/i.test(m)));

  for (const [flow, cs] of [["none", "1"], ["minimal", "2"], ["moderate", "3"], ["marked", "4"]] as const) {
    const viaFlow = calculateORADS({ ...solidSmooth, bloodFlow: flow });
    const viaCs = calculateORADS({ ...solidSmooth, iotaColorScore: cs });
    assert.equal(viaFlow.status, "final", flow);
    assert.equal(viaFlow.category, viaCs.category, `${flow} ≡ CS${cs}`);
  }

  const explicitWins = calculateORADS({ ...solidSmooth, bloodFlow: "marked", iotaColorScore: "1" });
  assert.equal(explicitWins.category, calculateORADS({ ...solidSmooth, iotaColorScore: "1" }).category);
});

test("results saved before `status` existed stay final", () => {
  const legacy = {
    category: 4,
    riskText: "Риск ЗНО 10–50%",
    recommendation: "",
    rationale: "",
    volumeMl: null,
  } as unknown as OradsResult;
  assert.equal(isOradsFinal(legacy), true);
  assert.equal(oradsCategoryLabel(legacy), "O-RADS 4");
  assert.doesNotThrow(() => buildProtocolOneLiner(legacy));
});

test("complete data keeps the engine category", () => {
  const r = calculateORADS({ ...simpleCyst, lengthMm: 50, widthMm: 40, heightMm: 35 });
  assert.equal(r.status, "final");
  assert.equal(oradsFinalCategory(r), r.category);
  assert.equal(oradsCategoryLabel(r), `O-RADS ${r.category}`);
  assert.deepEqual(r.missing, []);
});
