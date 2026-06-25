/**
 * Генератор JSON-кривых из таблиц Медведев 2016 (Прил. 1, мозг).
 * p50 → mean; sd = (p95 − p5) / 3.29  (нормальное распределение, z±1.645).
 *
 * Источник цифр: @repo/medvedev-reference/medvedevBiometry.ts (Медведев и соавт., 1999).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

const band = (p5, p50, p95) => ({ p5, p50, p95 });

const BIOMETRY_ROWS = [
  { week: 16, bpd: band(31, 34, 37), ofd: band(41, 45, 49), hc: band(112, 124, 136), ac: band(88, 102, 116), fl: band(17, 20, 23), hl: band(15, 18, 21) },
  { week: 17, bpd: band(34, 38, 42), ofd: band(46, 50, 54), hc: band(121, 135, 149), ac: band(93, 112, 131), fl: band(20, 24, 28), hl: band(17, 21, 25) },
  { week: 18, bpd: band(37, 42, 47), ofd: band(49, 54, 59), hc: band(131, 146, 161), ac: band(104, 124, 144), fl: band(23, 27, 31), hl: band(20, 24, 28) },
  { week: 19, bpd: band(41, 45, 49), ofd: band(53, 58, 63), hc: band(142, 158, 174), ac: band(114, 134, 154), fl: band(26, 30, 34), hl: band(23, 27, 31) },
  { week: 20, bpd: band(43, 48, 53), ofd: band(56, 62, 68), hc: band(154, 170, 186), ac: band(124, 144, 164), fl: band(29, 33, 37), hl: band(26, 30, 34) },
  { week: 21, bpd: band(46, 51, 56), ofd: band(60, 66, 72), hc: band(166, 183, 200), ac: band(137, 157, 177), fl: band(32, 36, 40), hl: band(29, 33, 37) },
  { week: 22, bpd: band(48, 54, 60), ofd: band(64, 70, 76), hc: band(178, 195, 212), ac: band(148, 169, 190), fl: band(35, 39, 43), hl: band(31, 35, 39) },
  { week: 23, bpd: band(52, 58, 64), ofd: band(67, 74, 81), hc: band(190, 207, 224), ac: band(160, 181, 202), fl: band(37, 41, 45), hl: band(34, 38, 42) },
  { week: 24, bpd: band(55, 61, 67), ofd: band(71, 78, 85), hc: band(201, 219, 237), ac: band(172, 193, 224), fl: band(40, 44, 48), hl: band(36, 40, 44) },
  { week: 25, bpd: band(58, 64, 70), ofd: band(73, 81, 89), hc: band(214, 232, 250), ac: band(183, 206, 229), fl: band(42, 46, 50), hl: band(39, 43, 47) },
  { week: 26, bpd: band(61, 67, 73), ofd: band(77, 85, 93), hc: band(224, 243, 262), ac: band(194, 217, 240), fl: band(45, 49, 53), hl: band(41, 45, 49) },
  { week: 27, bpd: band(64, 70, 76), ofd: band(80, 88, 96), hc: band(235, 254, 273), ac: band(205, 229, 253), fl: band(47, 51, 55), hl: band(43, 47, 51) },
  { week: 28, bpd: band(67, 73, 79), ofd: band(83, 91, 99), hc: band(245, 265, 285), ac: band(217, 241, 265), fl: band(49, 53, 57), hl: band(45, 49, 53) },
  { week: 29, bpd: band(70, 76, 82), ofd: band(86, 94, 102), hc: band(255, 275, 295), ac: band(228, 253, 278), fl: band(50, 55, 60), hl: band(47, 51, 55) },
  { week: 30, bpd: band(71, 78, 85), ofd: band(89, 97, 105), hc: band(265, 285, 305), ac: band(238, 264, 290), fl: band(52, 57, 62), hl: band(49, 53, 57) },
  { week: 31, bpd: band(73, 80, 87), ofd: band(93, 101, 109), hc: band(273, 294, 315), ac: band(247, 274, 301), fl: band(54, 59, 64), hl: band(51, 55, 59) },
  { week: 32, bpd: band(75, 82, 89), ofd: band(95, 104, 113), hc: band(283, 304, 325), ac: band(258, 286, 314), fl: band(56, 61, 66), hl: band(52, 56, 60) },
  { week: 33, bpd: band(77, 84, 91), ofd: band(98, 107, 116), hc: band(289, 311, 333), ac: band(267, 296, 325), fl: band(58, 63, 68), hl: band(54, 58, 62) },
  { week: 34, bpd: band(79, 86, 93), ofd: band(101, 110, 119), hc: band(295, 317, 339), ac: band(276, 306, 336), fl: band(60, 65, 70), hl: band(55, 59, 63) },
  { week: 35, bpd: band(81, 88, 95), ofd: band(103, 112, 121), hc: band(299, 322, 345), ac: band(285, 315, 345), fl: band(62, 67, 72), hl: band(57, 61, 65) },
  { week: 36, bpd: band(83, 90, 97), ofd: band(104, 114, 124), hc: band(303, 326, 349), ac: band(292, 323, 354), fl: band(64, 69, 74), hl: band(58, 62, 66) },
  { week: 37, bpd: band(85, 92, 98), ofd: band(106, 116, 126), hc: band(307, 330, 353), ac: band(299, 330, 361), fl: band(66, 71, 76), hl: band(59, 63, 67) },
  { week: 38, bpd: band(86, 94, 100), ofd: band(108, 118, 128), hc: band(309, 333, 357), ac: band(304, 336, 368), fl: band(68, 73, 78), hl: band(60, 64, 68) },
  { week: 39, bpd: band(88, 95, 102), ofd: band(109, 119, 129), hc: band(311, 335, 359), ac: band(310, 342, 374), fl: band(69, 74, 79), hl: band(60, 65, 70) },
  { week: 40, bpd: band(89, 96, 103), ofd: band(110, 120, 130), hc: band(312, 337, 362), ac: band(313, 347, 381), fl: band(70, 75, 80), hl: band(61, 66, 71) },
];

const BRAIN_ROWS = [
  { week: 16, cerebellumTransverse: band(12, 14, 16) },
  { week: 17, cerebellumTransverse: band(14, 16, 18) },
  { week: 18, lateralVentricle: band(4.9, 6.2, 7.5), cisternaMagna: band(2.8, 4.4, 6.0), cerebellumTransverse: band(15, 17, 19) },
  { week: 19, lateralVentricle: band(5.0, 6.3, 7.6), cisternaMagna: band(3.0, 4.6, 6.2), cerebellumTransverse: band(16, 18, 20) },
  { week: 20, lateralVentricle: band(5.1, 6.4, 7.7), cisternaMagna: band(3.2, 4.8, 6.4), cerebellumTransverse: band(18, 20, 22) },
  { week: 21, lateralVentricle: band(5.1, 6.5, 7.9), cisternaMagna: band(3.4, 5.1, 6.8), cerebellumTransverse: band(19, 21, 23) },
  { week: 22, lateralVentricle: band(5.2, 6.6, 8.0), cisternaMagna: band(3.6, 5.4, 7.2), cerebellumTransverse: band(20, 23, 26) },
  { week: 23, lateralVentricle: band(5.3, 6.8, 8.3), cisternaMagna: band(3.9, 5.7, 7.5), cerebellumTransverse: band(21, 24, 27) },
  { week: 24, lateralVentricle: band(5.4, 6.9, 8.4), cisternaMagna: band(4.1, 6.0, 7.9), cerebellumTransverse: band(23, 26, 29) },
  { week: 25, lateralVentricle: band(5.5, 7.0, 8.5), cisternaMagna: band(4.2, 6.2, 8.2), cerebellumTransverse: band(24, 27, 30) },
  { week: 26, lateralVentricle: band(5.6, 7.2, 8.7), cisternaMagna: band(4.4, 6.4, 8.4), cerebellumTransverse: band(26, 29, 32) },
];

const BIOMETRY_META = {
  bpd: { label: "Biparietal Diameter", labelRu: "BPD (БПР)" },
  ofd: { label: "Occipitofrontal Diameter", labelRu: "OFD (ЛЗР)" },
  hc: { label: "Head Circumference", labelRu: "HC (ОГ)" },
  ac: { label: "Abdominal Circumference", labelRu: "AC (ОЖ)" },
  fl: { label: "Femur Length", labelRu: "FL (ДБ)" },
  hl: { label: "Humerus Length", labelRu: "HL (ДП)" },
};

const BRAIN_META = {
  lateralVentricle: { id: "lateral_ventricle", label: "Lateral Ventricles", labelRu: "Лат. желудочки" },
  cisternaMagna: { id: "cisterna_magna", label: "Cisterna Magna", labelRu: "Большая цистерна" },
  cerebellumTransverse: { id: "cerebellum_transverse", label: "Transcerebellar Diameter", labelRu: "Мозжечок (поперечный)" },
};

function toAnchors(rows, key) {
  return rows
    .filter((r) => r[key])
    .map((r) => {
      const b = r[key];
      const sd = (b.p95 - b.p5) / 3.29;
      return { gaWeeks: r.week, mean: b.p50, sd: Math.round(sd * 1000) / 1000 };
    });
}

function writeCurve(dir, fileName, curve) {
  const path = join(root, dir, fileName);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(curve, null, 2) + "\n");
}

const SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 1 (Медведев и соавт., 1999). PDF скрининг 18–21 — скан; цифры верифицированы по книге.";

for (const [key, meta] of Object.entries(BIOMETRY_META)) {
  writeCurve("biometry", `${key}.json`, {
    id: key,
    label: meta.label,
    labelRu: meta.labelRu,
    engine: "medvedev",
    source: SOURCE,
    unit: "mm",
    xAxis: { type: "gaWeeks", min: 18, max: 41.857 },
    model: { type: "mean_sd_anchors", anchors: toAnchors(BIOMETRY_ROWS, key) },
    percentileDisplay: [3, 5, 10, 50, 90, 95, 97],
    supportsGrowthVelocity: true,
    supportsGaFromValue: true,
  });
}

for (const [key, meta] of Object.entries(BRAIN_META)) {
  writeCurve("brain", `${meta.id}.json`, {
    id: meta.id,
    label: meta.label,
    labelRu: meta.labelRu,
    engine: "medvedev",
    source: SOURCE + " Таблица мозга, стр. 622.",
    unit: "mm",
    xAxis: { type: "gaWeeks", min: 18, max: 26 },
    model: { type: "mean_sd_anchors", anchors: toAnchors(BRAIN_ROWS, key) },
    percentileDisplay: [3, 5, 10, 50, 90, 95, 97],
    supportsGrowthVelocity: true,
    supportsGaFromValue: false,
  });
}

writeCurve("", "manifest.json", {
  version: "0.1.0",
  trimester: "second_third",
  gaRange: { minWeeks: 18, maxWeeks: 41, maxDays: 6 },
  biometry: Object.keys(BIOMETRY_META),
  brain: Object.values(BRAIN_META).map((m) => m.id),
  primarySources: [
    "Медведев М.В. Пренатальная эхография, 2016",
    "Uzicenter III скрининг 30–34 н. (протокол; OCR pending)",
  ],
});

console.log("Generated biometry + brain curves in", root);
