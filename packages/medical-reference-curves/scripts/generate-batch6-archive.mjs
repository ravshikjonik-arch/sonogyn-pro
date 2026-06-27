/**
 * Batch 6: archive cards 57-8 … 57-19 (skip 57-13 partial A.3 sample).
 *
 * Запуск: node scripts/generate-batch6-archive.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "../..");
const outDir = join(root, "medvedev-reference/data/archive-tables");
const ssot = JSON.parse(readFileSync(join(root, "medvedev-reference/data/biometry-rows.json"), "utf8"));

function w(file, data) {
  writeFileSync(join(outDir, file), `${JSON.stringify(data, null, 2)}\n`);
  console.log("wrote", file);
}

function gaWeek(w) {
  return { weeks: w, days: 0 };
}

function gaRange(fromW, toW) {
  return { from: gaWeek(fromW), to: gaWeek(toW) };
}

function band(p5, p50, p95) {
  return { p5, p50, p95 };
}

const psvAorta = [
  [14, 36, 42, 48], [15, 38, 44, 50], [16, 38, 45, 52], [17, 39, 46, 53], [18, 40, 47, 54],
  [19, 40, 48, 56], [20, 41, 49, 57], [21, 42, 50, 58], [22, 42, 51, 60], [23, 43, 52, 61],
  [24, 44, 53, 62], [25, 44, 54, 64], [26, 45, 55, 65], [27, 45, 56, 67], [28, 46, 57, 68],
  [29, 47, 58, 69], [30, 48, 59, 70],
];
w("table-2-69.json", {
  tableId: "2.69",
  titleRu: "Нормативные значения ПССК в аорте плода",
  source: "М.В. Медведев и соавт., 1996",
  clinicalBlock: "doppler_late",
  tableType: "percentile_by_ga",
  parameter: { id: "aorticPsv", labelRu: "ПССК в аорте", unit: "cm/s" },
  partial: true,
  partialNote: "На карточке видны недели 14–30",
  rows: psvAorta.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-8.jpeg",
  verified: false,
});

const iliumBpd = [
  [32, 8.4, 8.5, 9.2], [33, 8.8, 9.2, 10.3], [34, 9.1, 9.5, 10.7], [35, 9.4, 9.6, 10.9],
  [36, 9.8, 9.9, 11.4], [37, 10.1, 10.2, 11.5], [38, 10.4, 10.5, 11.7], [39, 10.7, 10.8, 12.0],
  [40, 11.1, 11.4, 13.8], [41, 11.4, 12.2, 13.5],
];
w("table-2-55.json", {
  tableId: "2.55",
  titleRu: "Длина подвздошной кости в зависимости от БПР (конец I – начало II триместра)",
  source: "A. Zoppi et al., 1998",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_bpd",
  xAxis: { id: "bpd", labelRu: "БПР", unit: "mm" },
  parameter: { id: "iliumLength", labelRu: "Длина подвздошной кости", unit: "mm" },
  rows: iliumBpd.map(([bpdMm, p5, p50, p95]) => ({ bpdMm, p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-9.jpeg",
  verified: false,
});

const laRaw = [
  [14, 1.96, 3.16, 4.37], [15, 2.49, 3.8, 5.12], [16, 3.0, 4.43, 5.86], [17, 3.5, 5.04, 6.58],
  [18, 3.99, 5.64, 7.29], [19, 4.46, 6.22, 7.98], [20, 4.92, 6.79, 8.66], [21, 5.36, 7.35, 9.33],
  [22, 5.79, 7.89, 9.99], [23, 6.21, 8.42, 10.62], [24, 6.61, 8.93, 11.25], [25, 7.0, 9.43, 11.86],
  [26, 7.38, 9.92, 12.46], [27, 7.74, 10.39, 13.04], [28, 8.09, 10.85, 13.61], [29, 8.42, 11.29, 14.17],
  [30, 8.74, 11.72, 14.73], [31, 9.04, 12.14, 15.24], [32, 9.34, 12.54, 15.75], [33, 9.61, 12.93, 16.25],
  [34, 9.88, 13.31, 16.74], [35, 10.12, 13.67, 17.21], [36, 10.36, 14.01, 17.67], [37, 10.58, 14.35, 18.11],
  [38, 10.79, 14.66, 18.54], [39, 10.98, 14.97, 18.96], [40, 11.16, 15.26, 19.36],
];
w("table-2-38.json", {
  tableId: "2.38",
  titleRu: "Нормативные значения ширины левого предсердия сердца плода",
  source: "I. Shapiro et al., 1998",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "leftAtriumWidth", labelRu: "Ширина левого предсердия", unit: "mm" },
  percentileLabels: { low: "p2_5", mid: "p50", high: "p97_5" },
  rows: laRaw.map(([wk, p2_5, p50, p97_5]) => ({ ga: gaWeek(wk), p2_5, p50, p97_5 })),
  sourceCard: "image-26-06-26-04-57-10.jpeg",
  verified: false,
});

w("table-2-20.json", {
  tableId: "2.20",
  titleRu: "Нормативные значения диаметра хрусталика",
  source: "I. Goldstein et al., 1998",
  clinicalBlock: "fetometry",
  tableType: "percentile_partial",
  parameter: { id: "lensDiameter", labelRu: "Диаметр хрусталика", unit: "mm" },
  percentileLabels: { low: "p10", mid: "p50", high: "p90" },
  rows: [
    { ga: gaWeek(14), p10: 2.1, p50: 2.5, p90: 2.9 },
    { ga: gaWeek(15), p10: 2.7, p50: 2.9, p90: 3.2 },
    { ga: gaWeek(16), p10: 2.7, p50: 2.9, p90: 3.2 },
    { ga: gaRange(17, 18), p10: 2.8, p50: 3.0, p90: 5.0 },
    { ga: gaRange(19, 20), p10: 3.6, p50: 4.0, p90: 5.0 },
    { ga: gaWeek(21), p10: 3.7, p50: 4.0, p90: 5.0 },
    { ga: gaWeek(22), p10: 3.9, p50: 4.3, p90: 5.0 },
    { ga: gaWeek(23), p10: 3.8, p50: 5.0, p90: 5.0 },
    { ga: gaWeek(24), p10: 4.0, p50: 4.6, p90: 5.0 },
    { ga: gaWeek(25), p10: 4.2, p50: 5.0, p90: 5.2 },
    { ga: gaWeek(26), p10: 4.4, p50: 5.1, p90: 5.5 },
    { ga: gaWeek(27), p10: 4.4, p50: 5.1, p90: 5.5 },
    { ga: gaWeek(28), p10: 4.5, p50: 5.2, p90: 5.5 },
    { ga: gaWeek(29), p10: 4.6, p50: 5.2, p90: 5.9 },
    { ga: gaRange(30, 31), p10: 4.8, p50: 5.5, p90: 5.7 },
    { ga: gaRange(32, 33), p10: 4.8, p50: 5.5, p90: 6.2 },
    { ga: gaRange(34, 36), p10: 5.4, p50: 5.7, p90: 6.5 },
  ],
  sourceCard: "image-26-06-26-04-57-11.jpeg",
  verified: false,
});

w("table-2-3.json", {
  tableId: "2.3",
  titleRu: "Нормативные значения ОГ в зависимости от срока беременности",
  source: "М.В. Медведев и соавт., 1999",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  ssotDerivedFrom: "biometry-rows.json",
  parameter: { id: "hc", labelRu: "ОГ (HC)", unit: "mm" },
  rows: ssot.biometry.map((r) => ({
    ga: gaWeek(r.week),
    p5: r.hc.p5,
    p50: r.hc.p50,
    p95: r.hc.p95,
  })),
  sourceCard: "image-26-06-26-04-57-12.jpeg",
  verified: false,
});

w("table-A-3.json", {
  tableId: "A.3",
  titleRu: "Региональные нормативы фетометрии (Ярославль, М.В. Хитров и соавт., 1999)",
  source: "М.В. Хитров, Ярославль, 1999",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  percentileLabels: { low: "p10", mid: "p50", high: "p90" },
  partial: true,
  partialNote: "На карточке 16–42 нед; в JSON пока верифицированные строки, полный OCR — batch 6b",
  rows: [
    { ga: gaWeek(16), bpd: { p10: 30, p50: 35, p90: 41 }, ac: { p10: 94, p50: 111, p90: 129 }, fl: { p10: 17, p50: 21, p90: 26 } },
    { ga: gaWeek(17), bpd: { p10: 33, p50: 38, p90: 43 }, ac: { p10: 105, p50: 120, p90: 138 }, fl: { p10: 19, p50: 24, p90: 29 } },
    { ga: gaWeek(18), bpd: { p10: 38, p50: 42, p90: 46 }, ac: { p10: 118, p50: 135, p90: 149 }, fl: { p10: 24, p50: 28, p90: 32 } },
    { ga: gaWeek(30), bpd: { p10: 73, p50: 78, p90: 83 }, ac: { p10: 242, p50: 261, p90: 282 }, fl: { p10: 54, p50: 58, p90: 62 } },
    { ga: gaWeek(42), bpd: { p10: 90, p50: 94, p90: 99 }, ac: { p10: 325, p50: 348, p90: 372 }, fl: { p10: 71, p50: 75, p90: 79 } },
  ],
  sourceCard: "image-26-06-26-04-57-13.jpeg",
  verified: false,
});

const placentaRaw = [
  [14, 14.99, 19.0, 23.01], [15, 17.16, 20.59, 24.01], [16, 17.79, 20.98, 24.18], [17, 20.81, 23.98, 27.15],
  [18, 20.12, 23.68, 27.24], [19, 19.39, 23.02, 26.65], [20, 21.73, 25.12, 28.51], [21, 22.59, 25.38, 28.17],
  [22, 24.09, 26.96, 29.83], [23, 24.41, 27.92, 31.43], [24, 24.61, 27.64, 30.67], [25, 25.25, 28.84, 32.43],
  [26, 26.76, 29.74, 32.72], [27, 27.71, 32.74, 37.77], [28, 29.25, 34.66, 40.07], [29, 29.11, 34.12, 39.13],
  [30, 29.87, 35.32, 40.77], [31, 30.7, 36.1, 41.5], [32, 30.73, 35.32, 39.9], [33, 32.25, 36.03, 39.81],
  [34, 30.75, 37.11, 43.46], [35, 35.66, 42.26, 48.86], [36, 33.74, 40.53, 47.32], [37, 35.45, 41.0, 46.55],
  [38, 40.34, 42.93, 45.52], [39, 39.1, 43.15, 47.2], [40, 39.81, 43.25, 46.69],
];
w("table-2-61.json", {
  tableId: "2.61",
  titleRu: "Нормативные значения толщины плаценты",
  source: "Е.А. Яковенко, 1994",
  clinicalBlock: "anatomy_other",
  tableType: "percentile_by_ga",
  parameter: { id: "placentaThickness", labelRu: "Толщина плаценты", unit: "mm" },
  rows: placentaRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-14.jpeg",
  verified: false,
});

const paRaw = [
  [14, 1.4, 1.9, 2.4], [15, 1.7, 2.2, 2.7], [16, 1.9, 2.4, 3.0], [17, 2.1, 2.7, 3.3], [18, 2.3, 3.0, 3.7],
  [19, 2.5, 3.3, 4.1], [20, 2.7, 3.6, 4.5], [21, 3.0, 3.9, 4.8], [22, 3.3, 4.2, 5.1], [23, 3.5, 4.5, 5.4],
  [24, 3.7, 4.7, 5.7], [25, 3.9, 5.0, 6.1], [26, 4.2, 5.3, 6.4], [27, 4.3, 5.5, 6.7], [28, 4.6, 5.8, 7.0],
  [29, 4.8, 6.1, 7.4], [30, 5.1, 6.4, 7.7], [31, 5.4, 6.7, 8.0], [32, 5.6, 7.0, 8.4], [33, 5.8, 7.2, 8.6],
  [34, 6.0, 7.4, 8.9], [35, 6.2, 7.7, 9.2], [36, 6.5, 8.0, 9.5], [37, 6.8, 8.3, 9.8], [38, 7.0, 8.6, 10.2],
  [39, 7.2, 8.8, 10.4], [40, 7.4, 9.0, 10.6],
];
w("table-2-44.json", {
  tableId: "2.44",
  titleRu: "Нормативные значения диаметра легочной артерии",
  source: "М.В. Медведев, 1987",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "pulmonaryArteryDiameter", labelRu: "Диаметр легочной артерии", unit: "mm" },
  rows: paRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-15.jpeg",
  verified: false,
});

const tongueRaw = [
  [14, 24, 28, 31], [15, 26, 33, 36], [16, 33, 36, 38], [17, 37, 37, 38], [18, 40, 43, 46],
  [19, 47, 48, 51], [20, 47, 51, 56], [21, 51, 55, 61], [22, 52, 58, 62], [23, 58, 62, 68],
  [24, 60, 64, 67], [25, 68, 70, 73], [26, 71, 73, 76],
];
w("table-2-27.json", {
  tableId: "2.27",
  titleRu: "Нормативные значения периметра языка плода",
  source: "R. Achiron et al., 1997",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "tonguePerimeter", labelRu: "Периметр языка", unit: "mm" },
  partial: true,
  partialNote: "На карточке видны недели 14–26",
  rows: tongueRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-16.jpeg",
  verified: false,
});

w("table-2-9.json", {
  tableId: "2.9",
  titleRu: "Нормативные значения ширины III желудочка",
  source: "О.Е. Озерова, 1987",
  clinicalBlock: "fetometry",
  tableType: "mean_range_by_ga",
  parameter: { id: "thirdVentricleWidth", labelRu: "Ширина III желудочка", unit: "mm" },
  rows: [
    { ga: gaRange(27, 28), mean: 1.2, rangeMin: 1, rangeMax: 2 },
    { ga: gaRange(29, 30), mean: 1.5, rangeMin: 1, rangeMax: 2 },
    { ga: gaRange(31, 32), mean: 1.5, rangeMin: 1, rangeMax: 2 },
    { ga: gaRange(33, 34), mean: 2.1, rangeMin: 1, rangeMax: 3 },
    { ga: gaRange(35, 36), mean: 1.9, rangeMin: 1, rangeMax: 3 },
    { ga: gaRange(37, 38), mean: 2.1, rangeMin: 1, rangeMax: 3 },
    { ga: gaRange(39, 40), mean: 2.8, rangeMin: 2, rangeMax: 4 },
  ],
  sourceCard: "image-26-06-26-04-57-17.jpeg",
  verified: false,
});

w("table-1-7.json", {
  tableId: "1.7",
  titleRu: "Нормативные показатели ТВП в зависимости от КТР",
  source: "Н.А. Алтынник, М.В. Медведев, 2012",
  clinicalBlock: "screening_i",
  tableType: "percentile_by_crl_range",
  gaAxis: "crl_mm",
  parameter: { id: "nt", labelRu: "ТВП (NT)", unit: "mm" },
  rows: [
    { crlMmFrom: 45, crlMmTo: 50, p5: 0.74, p50: 1.52, p95: 2.3 },
    { crlMmFrom: 51, crlMmTo: 55, p5: 0.76, p50: 1.54, p95: 2.32 },
    { crlMmFrom: 56, crlMmTo: 60, p5: 0.78, p50: 1.56, p95: 2.34 },
    { crlMmFrom: 61, crlMmTo: 65, p5: 0.81, p50: 1.59, p95: 2.37 },
    { crlMmFrom: 66, crlMmTo: 70, p5: 0.83, p50: 1.61, p95: 2.39 },
    { crlMmFrom: 71, crlMmTo: 75, p5: 0.85, p50: 1.63, p95: 2.41 },
    { crlMmFrom: 76, crlMmTo: 80, p5: 0.87, p50: 1.65, p95: 2.43 },
    { crlMmFrom: 81, crlMmTo: 84, p5: 0.89, p50: 1.67, p95: 2.45 },
  ],
  sourceCard: "image-26-06-26-04-57-18.jpeg",
  verified: false,
});

const a9Raw = [
  [15, 26, 29, 32, 14, 16, 20, 26, 29, 32], [16, 30, 32, 34, 18, 20, 23, 31, 34, 37],
  [17, 32, 36, 38, 21, 24, 28, 32, 36, 38], [18, 35, 40, 41, 24, 26, 28, 36, 40, 42],
  [19, 37, 42, 43, 26, 28, 31, 40, 44, 45], [20, 40, 45, 47, 30, 31, 34, 42, 47, 48],
  [21, 46, 49, 51, 33, 34, 37, 46, 51, 54], [22, 48, 51, 52, 35, 37, 40, 49, 54, 57],
  [23, 50, 55, 56, 37, 39, 42, 50, 57, 58], [24, 52, 57, 58, 40, 42, 45, 54, 61, 62],
  [25, 56, 61, 62, 42, 44, 46, 56, 64, 65], [26, 58, 64, 65, 45, 47, 50, 62, 67, 68],
  [27, 63, 67, 68, 45, 50, 52, 64, 70, 71], [28, 67, 69, 71, 49, 53, 55, 69, 74, 77],
  [29, 69, 73, 74, 52, 56, 56, 74, 77, 78], [30, 71, 76, 79, 54, 58, 60, 74, 80, 81],
  [31, 73, 78, 80, 56, 60, 60, 80, 83, 84], [32, 75, 80, 83, 56, 62, 63, 81, 86, 88],
  [33, 77, 82, 85, 57, 64, 65, 83, 89, 92], [34, 81, 84, 87, 62, 66, 67, 88, 92, 93],
  [35, 82, 87, 91, 63, 67, 68, 92, 95, 96], [36, 82, 88, 90, 62, 68, 71, 91, 98, 101],
  [37, 85, 90, 92, 66, 70, 73, 94, 100, 103], [38, 88, 91, 93, 68, 72, 74, 99, 103, 104],
  [39, 86, 93, 94, 67, 73, 75, 97, 106, 108], [40, 86, 95, 96, 68, 74, 78, 104, 109, 110],
];
w("table-A-9.json", {
  tableId: "A.9",
  titleRu: "Нормативные показатели фетометрии (Узбекистан, Ташкент, Ш.М. Камалидинова, 2011)",
  source: "Ш.М. Камалидинова, Ташкент, 2011",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  rows: a9Raw.map(([wk, b5, b50, b95, f5, f50, f95, s5, s50, s95]) => ({
    ga: gaWeek(wk),
    bpd: band(b5, b50, b95),
    fl: band(f5, f50, f95),
    sdz: band(s5, s50, s95),
  })),
  sourceCard: "image-26-06-26-04-57-19.jpeg",
  verified: false,
});

console.log("Batch 6: 13 table JSON files generated/updated");
