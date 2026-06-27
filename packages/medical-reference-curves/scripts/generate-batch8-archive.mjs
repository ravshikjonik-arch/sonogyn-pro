/**
 * Batch 8 (final): archive cards 04-57.jpeg … 04-58.jpeg (13 cards).
 * Дополняет table-2-65 (СМА ПССК 23–40) и table-2-70 (лёгочная ПССК 14–28).
 *
 * Запуск: node scripts/generate-batch8-archive.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "../../medvedev-reference/data/archive-tables");

function w(file, data) {
  writeFileSync(join(outDir, file), `${JSON.stringify(data, null, 2)}\n`);
  console.log("wrote", file);
}

function gaWeek(w, d = 0) {
  return { weeks: w, days: d };
}

function gaRange(fromW, toW, fromD = 0, toD = 6) {
  return { from: gaWeek(fromW, fromD), to: gaWeek(toW, toD) };
}

const lv8Raw = [
  [14, 2.9, 4.2, 5.5], [15, 3.2, 4.3, 5.5], [16, 3.0, 4.8, 9.4], [17, 3.7, 4.9, 6.2],
  [18, 3.9, 5.3, 6.7], [19, 3.7, 5.4, 7.1], [20, 4.5, 5.9, 7.4], [21, 4.3, 6.2, 8.1],
  [22, 4.6, 6.3, 8.0], [23, 4.8, 6.7, 8.5], [24, 4.3, 6.7, 9.0], [25, 3.5, 7.0, 10.6],
  [26, 4.9, 7.1, 9.3], [27, 5.4, 7.5, 9.7], [28, 5.4, 7.9, 10.4], [29, 5.3, 7.9, 10.4],
  [30, 3.0, 8.1, 15.9], [31, 5.8, 8.1, 10.4], [32, 5.5, 8.8, 12.1], [33, 5.6, 8.9, 12.2],
  [34, 6.3, 9.2, 12.0], [35, 4.5, 9.2, 13.9], [36, 8.1, 9.5, 10.8], [37, 3.9, 12.2, 20.5],
  [38, 7.4, 12.3, 17.1], [39, 10.7, 12.5, 14.3],
];
w("table-2-8.json", {
  tableId: "2.8",
  titleRu: "Нормативные значения ширины тела бокового желудочка головного мозга плода",
  source: "Е.А. Яковенко, 1994",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "lateralVentricleBodyWidth", labelRu: "Ширина тела бокового желудочка", unit: "mm" },
  partial: true,
  partialNote: "На карточке видны недели 14–39 (без 40)",
  rows: lv8Raw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57.jpeg",
  verified: false,
});

w("table-2-28.json", {
  tableId: "2.28",
  titleRu: "Нормативные значения диаметра трахеи плода",
  source: "М.В. Медведев, Н.А. Алтынник, 2008",
  clinicalBlock: "anatomy_other",
  tableType: "percentile_by_ga",
  parameter: { id: "tracheaDiameter", labelRu: "Диаметр трахеи", unit: "mm" },
  rows: [
    { ga: gaRange(16, 18), p5: 1.1, p50: 2.2, p95: 3.3 },
    { ga: gaRange(19, 21), p5: 1.3, p50: 2.4, p95: 3.5 },
    { ga: gaRange(22, 24), p5: 1.5, p50: 2.6, p95: 3.7 },
    { ga: gaRange(25, 27), p5: 1.6, p50: 2.8, p95: 4.0 },
    { ga: gaRange(28, 30), p5: 1.9, p50: 3.1, p95: 4.3 },
    { ga: gaRange(31, 33), p5: 2.2, p50: 3.4, p95: 4.6 },
    { ga: gaRange(34, 36), p5: 2.4, p50: 3.6, p95: 4.8 },
  ],
  sourceCard: "image-26-06-26-04-58-1.jpeg",
  verified: false,
});

const cspRaw = [
  [15, 1.8, 2.8, 3.7], [16, 2.1, 3.2, 4.2], [17, 2.4, 3.5, 4.6], [18, 2.7, 3.9, 5.0],
  [19, 2.9, 4.2, 5.5], [20, 3.2, 4.5, 5.8], [21, 3.4, 4.8, 6.2], [22, 3.6, 5.1, 6.6],
  [23, 3.7, 5.3, 6.9], [24, 3.9, 5.5, 7.2], [25, 4.0, 5.8, 7.5], [26, 4.1, 5.9, 7.8],
  [27, 4.2, 6.1, 8.0], [28, 4.3, 6.3, 8.3], [29, 4.3, 6.4, 8.5], [30, 4.3, 6.5, 8.7],
  [31, 4.4, 6.6, 8.8], [32, 4.3, 6.7, 9.0], [33, 4.3, 6.7, 9.1], [34, 4.3, 6.7, 9.2],
  [35, 4.2, 6.7, 9.3], [36, 4.1, 6.7, 9.4], [37, 4.0, 6.7, 9.4], [38, 3.8, 6.6, 9.4],
  [39, 3.7, 6.6, 9.5], [40, 3.5, 6.5, 9.4], [41, 3.3, 6.4, 9.4],
];
w("table-2-10.json", {
  tableId: "2.10",
  titleRu: "Нормативные значения ширины полости прозрачной перегородки головного мозга плода",
  source: "P. Falco et al., 2000",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "cspWidth", labelRu: "Ширина полости прозрачной перегородки", unit: "mm" },
  rows: cspRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-58-2.jpeg",
  verified: false,
});

w("table-1-8.json", {
  tableId: "1.8",
  titleRu: "Нормативные показатели переднезаднего размера IV желудочка в зависимости от КТР",
  source: "Н.А. Алтынник, М.В. Медведев, 2012",
  clinicalBlock: "screening_i",
  tableType: "percentile_by_crl_range",
  gaAxis: "crl_mm",
  parameter: { id: "fourthVentricleAp", labelRu: "ПЗР IV желудочка", unit: "mm" },
  rows: [
    { crlMmFrom: 45, crlMmTo: 50, p5: 1.29, p50: 1.62, p95: 1.95 },
    { crlMmFrom: 51, crlMmTo: 55, p5: 1.37, p50: 1.72, p95: 2.07 },
    { crlMmFrom: 56, crlMmTo: 60, p5: 1.46, p50: 1.86, p95: 2.26 },
    { crlMmFrom: 61, crlMmTo: 65, p5: 1.54, p50: 1.96, p95: 2.38 },
    { crlMmFrom: 66, crlMmTo: 70, p5: 1.62, p50: 2.07, p95: 2.52 },
    { crlMmFrom: 71, crlMmTo: 75, p5: 1.70, p50: 2.17, p95: 2.64 },
    { crlMmFrom: 76, crlMmTo: 80, p5: 1.78, p50: 2.26, p95: 2.74 },
    { crlMmFrom: 81, crlMmTo: 84, p5: 1.86, p50: 2.34, p95: 2.82 },
  ],
  sourceCard: "image-26-06-26-04-58-3.jpeg",
  verified: false,
});

const mcaTail = [
  [23, 29.3, 43.9], [24, 30.7, 46.0], [25, 32.1, 48.2], [26, 33.6, 50.4], [27, 35.2, 52.8],
  [28, 36.9, 55.4], [29, 38.7, 58.0], [30, 40.5, 60.7], [31, 42.4, 63.6], [32, 44.4, 66.6],
  [33, 46.5, 69.8], [34, 48.7, 73.1], [35, 51.1, 76.6], [36, 53.5, 80.2], [37, 56.0, 84.0],
  [38, 58.7, 88.0], [39, 61.5, 92.2], [40, 64.4, 96.6],
];
const existing265 = JSON.parse(readFileSync(join(outDir, "table-2-65.json"), "utf8"));
w("table-2-65.json", {
  ...existing265,
  rows: [
    ...existing265.rows,
    ...mcaTail.map(([wk, median, mom15]) => ({ ga: gaWeek(wk), median, mom15 })),
  ],
  sourceCard: "image-26-06-26-04-57-20.jpeg,image-26-06-26-04-58-4.jpeg",
});

w("table-2-51.json", {
  tableId: "2.51",
  titleRu: "Среднее и максимальное значения диаметра тонкого кишечника плода",
  source: "S. Parulekar, 1991",
  clinicalBlock: "anatomy_other",
  tableType: "mean_max_by_ga",
  parameter: { id: "smallIntestineDiameter", labelRu: "Диаметр тонкого кишечника", unit: "mm" },
  rows: [
    { ga: gaRange(10, 15), mean: 1.0, max: 1 },
    { ga: gaRange(15, 20), mean: 1.2, max: 2 },
    { ga: gaRange(20, 25), mean: 1.4, max: 2 },
    { ga: gaRange(25, 30), mean: 1.8, max: 3 },
    { ga: gaRange(30, 35), mean: 2.9, max: 6 },
    { ga: gaRange(35, 40), mean: 3.7, max: 8 },
    { ga: { from: gaWeek(40), to: gaWeek(42) }, mean: 4.4, max: 6 },
  ],
  sourceCard: "image-26-06-26-04-58-5.jpeg",
  verified: false,
});

const thymusPerimRaw = [
  [19, 7.8, 14.3, 20.9], [20, 8.8, 15.4, 22.0], [21, 9.9, 16.5, 23.0], [22, 10.9, 17.5, 24.1],
  [23, 12.0, 18.6, 25.1], [24, 13.0, 19.6, 26.2], [25, 14.1, 20.7, 27.2], [26, 15.1, 21.7, 28.3],
  [27, 16.2, 22.8, 29.3], [28, 17.2, 23.8, 30.4], [29, 18.3, 24.9, 31.4], [30, 19.3, 25.9, 32.5],
  [31, 20.4, 27.0, 33.5], [32, 21.4, 28.0, 34.6], [33, 22.5, 29.1, 35.7], [34, 23.5, 30.1, 36.7],
  [35, 24.6, 31.2, 37.8], [36, 25.6, 32.2, 38.8], [37, 26.7, 33.3, 39.9], [38, 27.7, 34.3, 40.9],
];
w("table-2-34.json", {
  tableId: "2.34",
  titleRu: "Нормативные значения периметра тимуса плода",
  source: "F. Gamez et al., 2010",
  clinicalBlock: "anatomy_other",
  tableType: "percentile_by_ga",
  parameter: { id: "thymusPerimeter", labelRu: "Периметр тимуса", unit: "mm" },
  partial: true,
  partialNote: "На карточке видны недели 19–38",
  rows: thymusPerimRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-58-6.jpeg",
  verified: false,
});

w("table-2-16.json", {
  tableId: "2.16",
  titleRu: "Нормативные значения угла между стволом мозга и червем мозжечка (II триместр)",
  source: "О.И. Козлова, М.В. Медведев, 2016",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "brainstemVermisAngle", labelRu: "Угол ствол–червь мозжечка", unit: "deg" },
  rows: [
    { ga: gaRange(18, 20), p5: 3.70, p50: 9.25, p95: 14.80 },
    { ga: gaRange(21, 23), p5: 3.74, p50: 7.94, p95: 12.14 },
    { ga: gaRange(24, 26), p5: 3.72, p50: 7.79, p95: 11.86 },
  ],
  sourceCard: "image-26-06-26-04-58-7.jpeg",
  verified: false,
});

w("table-1-13.json", {
  tableId: "1.13",
  titleRu: "Средние значения и колебания физиологической пупочной грыжи и диаметра пуповины",
  source: "H. Blaas et al., 1995",
  clinicalBlock: "early_dating",
  tableType: "mean_range_by_ga",
  rows: [
    { ga: gaWeek(7), herniaLength: { mean: 1.9, rangeMin: 0.2, rangeMax: 3.6 }, cordDiameter: { mean: 1.8, rangeMin: 1.0, rangeMax: 2.7 } },
    { ga: gaWeek(8), herniaLength: { mean: 2.4, rangeMin: 0.7, rangeMax: 4.1 }, cordDiameter: { mean: 2.1, rangeMin: 1.3, rangeMax: 3.0 } },
    { ga: gaWeek(9), herniaLength: { mean: 3.3, rangeMin: 1.6, rangeMax: 5.0 }, cordDiameter: { mean: 2.4, rangeMin: 1.6, rangeMax: 3.3 } },
    { ga: gaWeek(10), herniaLength: { mean: 4.0, rangeMin: 2.3, rangeMax: 5.7 }, cordDiameter: { mean: 2.7, rangeMin: 1.9, rangeMax: 3.6 } },
    { ga: gaWeek(11), herniaLength: { mean: 3.9, rangeMin: 2.2, rangeMax: 5.6 }, cordDiameter: { mean: 3.0, rangeMin: 2.2, rangeMax: 3.9 } },
    { ga: gaWeek(12), herniaLength: { mean: 0 }, cordDiameter: { mean: 3.3, rangeMin: 2.5, rangeMax: 4.2 } },
  ],
  sourceCard: "image-26-06-26-04-58-8.jpeg",
  verified: false,
});

const paPsvHead = [
  [14, 38, 43, 48], [15, 40, 45, 50], [16, 41, 47, 53], [17, 42, 49, 56], [18, 44, 51, 58],
  [19, 45, 53, 61], [20, 46, 55, 64], [21, 47, 57, 67], [22, 49, 59, 69], [23, 50, 61, 71],
  [24, 52, 63, 74], [25, 53, 65, 77], [26, 55, 67, 79], [27, 57, 69, 81], [28, 59, 71, 83],
];
const existing270 = JSON.parse(readFileSync(join(outDir, "table-2-70.json"), "utf8"));
w("table-2-70.json", {
  tableId: "2.70",
  titleRu: "Нормативные значения ПССК в легочной артерии плода",
  source: "М.В. Медведев и соавт., 1996",
  clinicalBlock: "doppler_late",
  tableType: "percentile_by_ga",
  parameter: { id: "pulmonaryArteryPsv", labelRu: "ПССК в лёгочной артерии", unit: "cm/s" },
  partial: false,
  note: undefined,
  rows: [
    ...paPsvHead.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
    ...existing270.rows,
  ],
  sourceCard: "image-26-06-26-04-58-9.jpeg,image-26-06-26-04-55-14.jpeg",
  verified: false,
});

const uterusRaw = [
  19, 9.6, 20, 9.9, 21, 10.2, 22, 10.5, 23, 10.8, 24, 11.1, 25, 11.4, 26, 11.7, 27, 12.0,
  28, 12.3, 29, 12.6, 30, 12.9, 31, 13.2, 32, 13.5, 33, 13.8, 34, 14.1, 35, 14.4, 36, 14.7,
  37, 15.0, 38, 15.3, 39, 15.6,
];
const uterusRows = [];
for (let i = 0; i < uterusRaw.length; i += 2) {
  uterusRows.push({ ga: gaWeek(uterusRaw[i]), p50: uterusRaw[i + 1] });
}
w("table-2-57.json", {
  tableId: "2.57",
  titleRu: "Нормативные значения 50-го процентиля поперечного размера матки у плода",
  source: "D. Soriano et al., 1999",
  clinicalBlock: "anatomy_other",
  tableType: "p50_only_by_ga",
  parameter: { id: "fetalUterusTransverse", labelRu: "Поперечный размер матки", unit: "mm" },
  partial: true,
  partialNote: "На карточке видны недели 19–39",
  rows: uterusRows,
  sourceCard: "image-26-06-26-04-58-10.jpeg",
  verified: false,
});

const lv40Raw = [
  [14, 1.1, 2.4, 3.7], [15, 1.5, 3.0, 4.5], [16, 2.0, 3.6, 5.2], [17, 2.6, 4.3, 6.0],
  [18, 3.3, 5.0, 6.7], [19, 3.6, 5.6, 7.6], [20, 4.1, 6.2, 8.3], [21, 4.6, 6.8, 9.0],
  [22, 5.1, 7.3, 9.5], [23, 5.6, 7.8, 10.0], [24, 6.1, 8.3, 10.5], [25, 6.4, 8.7, 11.0],
  [26, 6.7, 9.1, 11.5], [27, 7.0, 9.5, 12.0], [28, 7.3, 9.9, 12.5], [29, 7.6, 10.3, 13.0],
  [30, 7.8, 10.6, 13.4], [31, 8.0, 10.9, 13.8], [32, 8.2, 11.2, 14.2], [33, 8.4, 11.5, 14.6],
  [34, 8.5, 11.7, 14.9], [35, 8.6, 11.9, 15.2], [36, 8.6, 12.1, 15.6], [37, 8.7, 12.3, 15.9],
  [38, 8.8, 12.5, 16.2], [39, 8.8, 12.6, 16.4], [40, 8.8, 12.7, 16.6],
];
w("table-2-40.json", {
  tableId: "2.40",
  titleRu: "Нормативные значения ширины левого желудочка сердца плода",
  source: "М.В. Медведев, 1987",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "leftVentricleWidth", labelRu: "Ширина левого желудочка", unit: "mm" },
  rows: lv40Raw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-58-11.jpeg",
  verified: false,
});

const isthmusRaw = [
  [18, 1.48, 2.04, 2.82], [19, 1.58, 2.18, 3.01], [20, 1.68, 2.32, 3.21], [21, 1.79, 2.47, 3.40],
  [22, 1.89, 2.61, 3.60], [23, 2.00, 2.76, 3.81], [24, 2.11, 2.91, 4.01], [25, 2.21, 3.05, 4.21],
  [26, 2.32, 3.20, 4.42], [27, 2.43, 3.36, 4.63], [28, 2.54, 3.51, 4.84], [29, 2.65, 3.66, 5.05],
  [30, 2.77, 3.82, 5.27], [31, 2.88, 3.97, 5.48], [32, 2.99, 4.13, 5.70], [33, 3.11, 4.29, 5.92],
  [34, 3.23, 4.45, 6.14], [35, 3.34, 4.61, 6.36], [36, 3.46, 4.77, 6.58], [37, 3.58, 4.93, 6.81],
];
w("table-2-45.json", {
  tableId: "2.45",
  titleRu: "Нормативные значения поперечного диаметра перешейка аорты плода",
  source: "L. Pasquini et al., 2007",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "aorticIsthmusDiameter", labelRu: "Диаметр перешейка аорты", unit: "mm" },
  percentileLabels: { low: "p2_5", mid: "p50", high: "p97_5" },
  rows: isthmusRaw.map(([wk, p2_5, p50, p97_5]) => ({ ga: gaWeek(wk), p2_5, p50, p97_5 })),
  sourceCard: "image-26-06-26-04-58.jpeg",
  verified: false,
});

console.log("Batch 8 (final): 11 new + 2-65/2-70 extended — archive 96/96 cards");
