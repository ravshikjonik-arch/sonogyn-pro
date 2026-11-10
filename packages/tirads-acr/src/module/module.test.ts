import assert from "node:assert/strict";
import test from "node:test";

import { evaluateThyroidStudy, generateThyroidReport, maxNoduleDiameterMm, missingNoduleDimensionsRu, type ThyroidNodule, type ThyroidStudyInput } from "./index";

const euIso = { composition: "solid", echogenicity: "isoechoic", shape: "oval", margins: "smooth", microcalcifications: "absent" } as const;
const euMild = { ...euIso, echogenicity: "mildly_hypoechoic" } as const;
const euHigh = { ...euIso, microcalcifications: "present" } as const;
const acrTr4 = {
  composition: "solid",
  echogenicity: "hypoechoic",
  shape: "wider_than_tall",
  margin: "smooth",
  echogenicFoci: ["none_or_comet_tail"],
} as const;

const nodule = (id: string, extra: Partial<ThyroidNodule>): ThyroidNodule => ({
  id,
  location: "right_lobe",
  dimensionsMm: { longitudinal: 18, anteroposterior: 14, transverse: 12 },
  ...extra,
});

const study = (nodules: ThyroidNodule[], extra: Partial<ThyroidStudyInput> = {}): ThyroidStudyInput => ({
  nodules,
  euProfile: "RU_KR_2024",
  ...extra,
});

test("largest diameter comes from the entered dimensions", () => {
  assert.equal(maxNoduleDiameterMm(nodule("a", {})), 18);
  assert.equal(maxNoduleDiameterMm(nodule("a", { dimensionsMm: undefined })), undefined);
});

test("size-based tactics need all three dimensions", () => {
  const partial = nodule("a", { dimensionsMm: { longitudinal: 18, transverse: 9 } });
  assert.equal(maxNoduleDiameterMm(partial), undefined);
  assert.deepEqual(missingNoduleDimensionsRu(partial), ["переднезадний"]);
  assert.equal(maxNoduleDiameterMm(nodule("a", { dimensionsMm: { longitudinal: 8.4, anteroposterior: 9.6, transverse: 7.1 } })), 9.6);
  const input = study([nodule("n1", { eu: euMild, dimensionsMm: { longitudinal: 18 } })]);
  const rep = generateThyroidReport(input, evaluateThyroidStudy(input), "eu");
  assert.match(rep.descriptionRu, /размеры не указаны полностью \(нет: переднезадний, поперечный\)/);
  assert.doesNotMatch(rep.tacticsRu, /ТАБ показана/);
});

test("multi-nodule: each nodule evaluated separately; highest category picked per system", () => {
  const input = study([
    nodule("n1", { eu: euIso, acr: acrTr4 }),
    nodule("n2", { location: "left_lobe", eu: euHigh, acr: { ...acrTr4, echogenicity: "hyperechoic_or_isoechoic" } }),
    nodule("n3", { location: "isthmus", eu: euMild }),
  ]);
  const r = evaluateThyroidStudy(input);
  assert.equal(r.errors.length, 0);
  assert.equal(r.nodules.length, 3);
  assert.equal(r.highestEu, "n2");
  assert.equal(r.highestAcr, "n1");
  assert.equal(r.nodules[2].acr, null, "ACR is not invented for a nodule without ACR answers");
});

test("ties are broken by the larger nodule", () => {
  const r = evaluateThyroidStudy(
    study([
      nodule("small", { eu: euMild, dimensionsMm: { longitudinal: 8, anteroposterior: 6, transverse: 5 } }),
      nodule("big", { eu: euMild, dimensionsMm: { longitudinal: 22, anteroposterior: 17, transverse: 15 } }),
    ]),
  );
  assert.equal(r.highestEu, "big");
});

test("comparison flags FNA disagreement without merging the systems", () => {
  const r = evaluateThyroidStudy(
    study([nodule("n1", { eu: euMild, acr: acrTr4, dimensionsMm: { longitudinal: 16, anteroposterior: 12, transverse: 10 } })], { euProfile: "ETA_2023" }),
  );
  const row = r.comparison[0];
  assert.equal(row.euCategory, 4);
  assert.equal(row.acrCategory, "TR4");
  assert.equal(row.euFna, "indicated"); // EU-4 >15
  assert.equal(row.acrFna, "indicated"); // TR4 ≥15
  assert.equal(row.fnaAgreement, true);

  const r2 = evaluateThyroidStudy(study([nodule("n1", { eu: euMild, acr: acrTr4, dimensionsMm: { longitudinal: 15, anteroposterior: 11, transverse: 9 } })]));
  assert.equal(r2.comparison[0].euFna, "not_indicated"); // 15 is not >15
  assert.equal(r2.comparison[0].acrFna, "indicated"); // 15 ≥15
  assert.equal(r2.comparison[0].fnaAgreement, false);
  assert.ok(r2.comparison[0].noteRu);
});

test("regional lymph nodes are passed to both engines but never change categories", () => {
  const r = evaluateThyroidStudy(study([nodule("n1", { eu: euIso, acr: acrTr4 })], { lymphNodes: "suspicious", euProfile: "ETA_2023" }));
  const row = r.nodules[0];
  assert.equal(row.eu?.status === "ok" && row.eu.category, 3);
  assert.equal(row.acr?.status === "ok" && row.acr.result.category, "TR4");
  assert.ok(row.eu?.status === "ok" && row.eu.warnings.some((w) => w.code === "suspicious_lymph_nodes"));
});

test("invalid study data produces errors", () => {
  const bad = evaluateThyroidStudy(study([nodule("n1", { dimensionsMm: { longitudinal: -2 } })]));
  assert.ok(bad.errors.length > 0);
  const dup = evaluateThyroidStudy(study([nodule("x", {}), nodule("x", {})]));
  assert.ok(dup.errors.some((e) => /Повторяющийся/.test(e.messageRu)));
});

test("report is generated from actual input; missing findings are marked, not invented", () => {
  const input = study([nodule("n1", { eu: { composition: "solid", echogenicity: "mildly_hypoechoic" } })]);
  const rep = generateThyroidReport(input, evaluateThyroidStudy(input), "eu");
  assert.match(rep.descriptionRu, /В правой доле определяется узловое образование, размерами 18,0×14,0×12,0 мм/);
  assert.match(rep.descriptionRu, /Эхогенность: умеренно гипоэхогенный/);
  assert.match(rep.descriptionRu, /Форма: не оценено/);
  assert.match(rep.descriptionRu, /Контуры: не оценено/);
  assert.match(rep.conclusionRu, /не хватает данных/);
  assert.doesNotMatch(rep.conclusionRu, /EU-TIRADS [1-5]\b/);
  assert.equal(rep.tacticsRu, "");
  assert.match(rep.descriptionRu, /Регионарные лимфоузлы: не оценивались/);
});

test("report: full EU-TIRADS 4 example with tactics and source", () => {
  const input = study([nodule("n1", { eu: euMild })]);
  const rep = generateThyroidReport(input, evaluateThyroidStudy(input), "eu");
  assert.match(rep.conclusionRu, /УЗ-признаки узлового образования правой доли щитовидной железы\. EU-TIRADS 4\./);
  assert.match(rep.tacticsRu, /EU-TIRADS \(КР 2024\): ТАБ показана/); // 18 > 15
  assert.ok(rep.sourcesRu.some((s) => /620_3/.test(s)));
  assert.match(rep.disclaimerRu, /Не является диагнозом/);
});

test("report never states a cancer diagnosis", () => {
  const input = study([nodule("n1", { eu: { ...euHigh, margins: "irregular", extrathyroidalExtension: "definite" }, acr: { ...acrTr4, shape: "taller_than_wide", echogenicFoci: ["punctate"] } })], {
    lymphNodes: "suspicious",
  });
  const rep = generateThyroidReport(input, evaluateThyroidStudy(input), "both");
  const all = [rep.descriptionRu, rep.conclusionRu, rep.tacticsRu, ...rep.warningsRu].join("\n");
  assert.doesNotMatch(all, /\bрак|карцином|злокачественн(ая|ое) опухол/i);
  assert.ok(rep.warningsRu.some((w) => /экстратиреоидное/i.test(w)));
  assert.match(rep.conclusionRu, /EU-TIRADS 5; ACR TI-RADS TR5/);
});

test("report for no nodules", () => {
  const input = study([{ id: "x", eu: { composition: "no_nodule" } }]);
  const rep = generateThyroidReport(input, evaluateThyroidStudy(input), "eu");
  assert.match(rep.descriptionRu, /Узловые образования не выявлены/);
  assert.match(rep.conclusionRu, /EU-TIRADS 1/);
});

test("multi-nodule report names the highest-risk nodule", () => {
  const input = study([nodule("a", { eu: euIso }), nodule("b", { location: "left_lobe", eu: euHigh })]);
  const rep = generateThyroidReport(input, evaluateThyroidStudy(input), "eu");
  assert.match(rep.descriptionRu, /Узел 1\. В правой доле/);
  assert.match(rep.descriptionRu, /Узел 2\. В левой доле/);
  assert.match(rep.conclusionRu, /Наибольшая категория риска — узел 2/);
});
