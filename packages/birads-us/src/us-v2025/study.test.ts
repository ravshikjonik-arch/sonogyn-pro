import assert from "node:assert/strict";
import test from "node:test";

import { generateBreastReport } from "./report";
import {
  evaluateBreastStudy,
  formatBreastMm,
  formatLesionDimensionsRu,
  missingLesionDimensionsRu,
  type BreastLesion,
  type BreastStudyInput,
} from "./study";
import type { BiradsUsLesionInput } from "./types";

const benign3: BiradsUsLesionInput = {
  kind: "mass",
  shape: "oval",
  orientation: "parallel",
  margin: "circumscribed",
  echoPattern: "hypoechoic",
  posterior: "none",
  calcifications: "none",
  associated: ["none"],
};
const suspicious: BiradsUsLesionInput = { ...benign3, shape: "irregular", margin: "spiculated" };

const lesion = (id: string, extra: Partial<BreastLesion>): BreastLesion => ({
  id,
  side: "right",
  clock: 10,
  distanceFromNippleMm: 30,
  dimensionsMm: { width: 12, anteroposterior: 8, length: 10 },
  findings: benign3,
  ...extra,
});

const study = (lesions: BreastLesion[], extra: Partial<BreastStudyInput> = {}): BreastStudyInput => ({
  sidesExamined: ["right", "left"],
  lesions,
  ...extra,
});

test("examined side without lesions is BI-RADS 1; not examined side has no category", () => {
  const r = evaluateBreastStudy(study([lesion("a", {})], { sidesExamined: ["right"] }));
  assert.equal(r.sides.find((s) => s.side === "left")?.status, "not_examined");
  const both = evaluateBreastStudy(study([]));
  for (const s of both.sides) assert.equal(s.status === "final" && s.info.category, "1");
});

test("side category follows the most worrisome lesion (ACR hierarchy 1<2<3<6<0<4<5)", () => {
  const r = evaluateBreastStudy(
    study([
      lesion("cyst", { findings: { kind: "special_case", specialCase: "simple_cyst" } }),
      lesion("fa", {}),
      lesion("ca", { findings: { ...suspicious, doctorCategory: "4C" } }),
      lesion("left", { side: "left", findings: { kind: "special_case", specialCase: "simple_cyst" } }),
    ]),
  );
  const right = r.sides.find((s) => s.side === "right");
  assert.equal(right?.status === "final" && right.info.category, "4C");
  assert.equal(right?.status === "final" && right.fromLesionId, "ca");
  const left = r.sides.find((s) => s.side === "left");
  assert.equal(left?.status === "final" && left.info.category, "2");

  const zeroVsThree = evaluateBreastStudy(study([lesion("x", { findings: { ...benign3, doctorCategory: "0" } }), lesion("y", {})], { sidesExamined: ["right"] }));
  const s = zeroVsThree.sides.find((x) => x.side === "right");
  assert.equal(s?.status === "final" && s.info.category, "0");
});

test("a suspicious lesion without the doctor's choice keeps the side pending", () => {
  const r = evaluateBreastStudy(study([lesion("fa", {}), lesion("ca", { findings: suspicious })]));
  const right = r.sides.find((s) => s.side === "right");
  assert.equal(right?.status, "pending");
  if (right?.status === "pending") assert.deepEqual(right.lesionIds, ["ca"]);
});

test("validation: clock, distance, dimensions, side not examined, duplicates", () => {
  assert.ok(evaluateBreastStudy(study([lesion("a", { clock: 13 })])).errors.length);
  assert.ok(evaluateBreastStudy(study([lesion("a", { distanceFromNippleMm: -1 })])).errors.length);
  assert.ok(evaluateBreastStudy(study([lesion("a", { dimensionsMm: { width: 0 } })])).errors.length);
  assert.ok(evaluateBreastStudy(study([lesion("a", { side: "left" })], { sidesExamined: ["right"] })).errors.length);
  assert.ok(evaluateBreastStudy(study([lesion("a", {}), lesion("a", {})])).errors.length);
});

test("suspicious lymph node gives a warning but does not change the lesion category", () => {
  const r = evaluateBreastStudy(study([lesion("fa", {})], { lymphNodes: [{ side: "right", station: "axillary_I", assessment: "suspicious" }] }));
  const right = r.sides.find((s) => s.side === "right");
  assert.equal(right?.status === "final" && right.info.category, "3");
  assert.ok(r.warningsRu.some((w) => /лимфоузел/i.test(w)));
});

test("report is built from entered findings; missing ones are marked, nothing invented", () => {
  const input = study([lesion("a", { findings: { kind: "mass", shape: "oval", orientation: "parallel" }, dimensionsMm: undefined })], {
    sidesExamined: ["right"],
  });
  const rep = generateBreastReport(input, evaluateBreastStudy(input));
  assert.match(rep.descriptionRu, /Правая молочная железа:/);
  assert.match(rep.descriptionRu, /Образование 1: на 10 ч, 30,0 мм от соска, размеры не указаны полностью \(нет: ширина, переднезадний, длина\)/);
  assert.match(rep.descriptionRu, /Форма: овальная/);
  assert.match(rep.descriptionRu, /Контур: не описано/);
  assert.match(rep.conclusionRu, /категория не определена/);
  assert.equal(rep.recommendationsRu, "");
});

test("report: category 3 example with likelihood, management, sources and disclaimer", () => {
  const input = study([lesion("a", {})], { sidesExamined: ["right", "left"] });
  const rep = generateBreastReport(input, evaluateBreastStudy(input));
  assert.match(rep.descriptionRu, /размерами 12,0×8,0×10,0 мм/);
  assert.match(rep.conclusionRu, /Правая молочная железа: BI-RADS 3 · вероятно доброкачественное \(по образованию 1\)/);
  assert.match(rep.conclusionRu, /Левая молочная железа: BI-RADS 1/);
  assert.match(rep.recommendationsRu, /6 месяцев/);
  assert.ok(rep.sourcesRu.some((s) => /v2025/.test(s)));
  assert.match(rep.disclaimerRu, /Не является диагнозом/);
});

test("report never states a cancer diagnosis", () => {
  const input = study([lesion("a", { findings: { ...suspicious, calcifications: "micro", associated: ["architectural_distortion", "skin_retraction"], doctorCategory: "5" } })], {
    lymphNodes: [{ side: "right", station: "axillary_II", assessment: "suspicious" }],
  });
  const rep = generateBreastReport(input, evaluateBreastStudy(input));
  const all = [rep.descriptionRu, rep.conclusionRu, rep.recommendationsRu, ...rep.warningsRu].join("\n");
  assert.doesNotMatch(all, /\bрак\b|карцином|онкомаршрут/i);
  assert.match(rep.conclusionRu, /BI-RADS 5/);
  assert.match(rep.descriptionRu, /Лимфоузел подмышечный, уровень II: подозрительные признаки/);
});

test("lesion dimensions: 44,2×39,4×42,9 мм only when all three are measured", () => {
  assert.equal(
    formatLesionDimensionsRu({ dimensionsMm: { width: 44.2, anteroposterior: 39.4, length: 42.9 } }),
    "44,2×39,4×42,9 мм",
  );
  assert.equal(formatLesionDimensionsRu({ dimensionsMm: { width: 12, anteroposterior: 8 } }), null);
  assert.deepEqual(missingLesionDimensionsRu({ dimensionsMm: { width: 12, anteroposterior: 8 } }), ["длина"]);
  assert.equal(formatBreastMm(12), "12,0");
});
