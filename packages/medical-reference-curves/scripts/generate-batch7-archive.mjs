/**
 * Batch 7: archive cards 57-20 … 57-31.
 * Дополняет table-2-69 (ПССК аорты 31–40); table-2-4 — SSOT mirror AC.
 *
 * Запуск: node scripts/generate-batch7-archive.mjs
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

function gaWeek(w, d = 0) {
  return { weeks: w, days: d };
}

function gaRange(fromW, toW, fromD = 0, toD = 6) {
  return { from: gaWeek(fromW, fromD), to: gaWeek(toW, toD) };
}

function band(p5, p50, p95) {
  return { p5, p50, p95 };
}

const mcaPsv = [
  [14, 19.9, 28.9], [15, 20.2, 30.3], [16, 21.1, 31.7], [17, 22.1, 33.2], [18, 23.2, 34.8],
  [19, 24.3, 36.5], [20, 25.5, 38.2], [21, 26.7, 40.0], [22, 27.9, 41.9],
];
w("table-2-65.json", {
  tableId: "2.65",
  titleRu: "Нормативные показатели ПССК в средней мозговой артерии плода",
  source: "G. Mari et al., 2000",
  clinicalBlock: "doppler_late",
  tableType: "median_mom_by_ga",
  parameter: { id: "mcaPsv", labelRu: "ПССК в СМА", unit: "cm/s" },
  rows: mcaPsv.map(([wk, median, mom15]) => ({ ga: gaWeek(wk), median, mom15 })),
  sourceCard: "image-26-06-26-04-57-20.jpeg",
  verified: false,
});

const spleenRaw = [
  [18, 2.3, 3.5, 4.7], [19, 2.7, 3.9, 5.1], [20, 3.3, 4.5, 5.7], [21, 3.5, 4.7, 5.9],
  [22, 4.1, 5.3, 6.5], [23, 4.5, 5.7, 6.9], [24, 4.9, 6.1, 7.2], [25, 5.3, 6.4, 7.7],
  [26, 5.5, 6.7, 7.9], [27, 5.9, 7.1, 8.3], [28, 6.2, 7.4, 8.6], [29, 6.5, 7.7, 8.9],
  [30, 6.9, 8.1, 9.3], [31, 7.3, 8.5, 9.7], [32, 7.7, 8.9, 10.1], [33, 8.1, 9.3, 10.5],
  [34, 8.6, 9.8, 11.0], [35, 9.1, 10.3, 11.5], [36, 9.7, 10.9, 12.1], [37, 10.4, 11.6, 12.8],
  [38, 11.1, 12.3, 13.4], [39, 11.8, 13.0, 14.2], [40, 12.7, 13.8, 15.1],
];
w("table-2-50.json", {
  tableId: "2.50",
  titleRu: "Нормативные значения периметра селезенки плода",
  source: "W. Schmidt et al., 1985",
  clinicalBlock: "anatomy_other",
  tableType: "percentile_by_ga",
  parameter: { id: "spleenPerimeter", labelRu: "Периметр селезенки", unit: "cm" },
  rows: spleenRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-21.jpeg",
  verified: false,
});

const thymusRaw = [
  [18, 7, 11, 15], [19, 9, 13, 17], [20, 10, 14, 18], [21, 12, 16, 20], [22, 13, 17, 21],
  [23, 14, 18, 22], [24, 15, 19, 23], [25, 16, 21, 26], [26, 18, 23, 28], [27, 19, 25, 31],
  [28, 21, 27, 33], [29, 22, 28, 34], [30, 24, 30, 36],
];
w("table-2-33.json", {
  tableId: "2.33",
  titleRu: "Нормативные значения поперечного диаметра тимуса плода",
  source: "Т.И. Титова, 2014",
  clinicalBlock: "anatomy_other",
  tableType: "percentile_by_ga",
  parameter: { id: "thymusDiameter", labelRu: "Поперечный диаметр тимуса", unit: "mm" },
  partial: true,
  partialNote: "На карточке видны недели 18–30",
  rows: thymusRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-22.jpeg",
  verified: false,
});

const vermisRaw = [
  [18, 7.9, 10.6, 13.1, 7.6, 8.6, 9.6], [19, 8.7, 11.3, 13.9, 8.1, 9.2, 10.3],
  [20, 9.3, 12.0, 14.7, 8.6, 9.8, 11.0], [21, 10.0, 12.8, 15.6, 9.3, 10.5, 11.8],
  [22, 10.7, 13.6, 16.5, 9.8, 11.2, 12.6], [23, 11.6, 14.6, 17.6, 10.5, 12.0, 13.5],
  [24, 12.7, 15.8, 18.9, 11.2, 12.8, 14.4], [25, 13.9, 17.0, 20.1, 11.9, 13.6, 15.3],
  [26, 15.1, 18.2, 21.3, 12.6, 14.4, 16.2],
];
w("table-2-15.json", {
  tableId: "2.15",
  titleRu: "Нормативные значения ККРЧМ и ПЗРЧМ червя мозжечка (II триместр)",
  source: "О.И. Козлова, М.В. Медведев, 2015",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  rows: vermisRaw.map(([wk, k5, k50, k95, p5, p50, p95]) => ({
    ga: gaWeek(wk),
    kkrchm: band(k5, k50, k95),
    pzrchm: band(p5, p50, p95),
  })),
  sourceCard: "image-26-06-26-04-57-23.jpeg",
  verified: false,
});

w("table-1-12.json", {
  tableId: "1.12",
  titleRu: "Нормативные показатели фетометрических параметров в 11–14 нед беременности",
  source: "Н.А. Алтынник, М.В. Медведев, 2002",
  clinicalBlock: "screening_i",
  tableType: "percentile_by_ga",
  rows: [
    { ga: gaWeek(11), bpd: band(13, 17, 21), hc: band(53, 63, 73), ac: band(40, 51, 62), fl: band(3.4, 5.6, 7.8) },
    { ga: gaWeek(12), bpd: band(18, 21, 24), hc: band(58, 71, 84), ac: band(50, 61, 72), fl: band(4.0, 7.3, 10.6) },
    { ga: gaWeek(13), bpd: band(20, 24, 28), hc: band(72, 84, 96), ac: band(58, 69, 80), fl: band(7.0, 9.4, 11.8) },
    { ga: gaWeek(14), bpd: band(23, 27, 31), hc: band(84, 97, 110), ac: band(66, 78, 90), fl: band(9.0, 12.4, 15.8) },
  ],
  sourceCard: "image-26-06-26-04-57-24.jpeg",
  verified: false,
});

const aorticTail = [
  [31, 48, 60, 72], [32, 49, 61, 73], [33, 49, 62, 75], [34, 50, 63, 76], [35, 50, 64, 78],
  [36, 51, 65, 79], [37, 52, 66, 80], [38, 53, 67, 81], [39, 53, 68, 83], [40, 54, 69, 84],
];
const existing269 = JSON.parse(readFileSync(join(outDir, "table-2-69.json"), "utf8"));
const tailRows = aorticTail.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 }));
w("table-2-69.json", {
  ...existing269,
  partial: false,
  partialNote: undefined,
  rows: [...existing269.rows, ...tailRows],
  sourceCard: "image-26-06-26-04-57-8.jpeg,image-26-06-26-04-57-25.jpeg",
});

const analRaw = [
  [19, 1.9, 4.5, 7.0], [20, 2.5, 5.0, 7.6], [21, 3.1, 5.6, 8.1], [22, 3.6, 6.1, 8.6],
  [23, 4.1, 6.6, 9.1], [24, 4.6, 7.1, 9.6], [25, 5.0, 7.5, 10.0], [26, 5.4, 7.9, 10.4],
  [27, 5.8, 8.3, 10.8], [28, 6.2, 8.7, 11.2], [29, 6.5, 9.0, 11.5], [30, 6.8, 9.3, 11.8],
  [31, 7.1, 9.6, 12.1], [32, 7.3, 9.8, 12.3], [33, 7.6, 10.1, 12.6], [34, 7.8, 10.3, 12.8],
  [35, 7.9, 10.4, 12.9], [36, 8.1, 10.6, 13.1], [37, 8.2, 10.7, 13.2], [38, 8.3, 10.8, 13.3],
];
w("table-2-56.json", {
  tableId: "2.56",
  titleRu: "Нормативные значения диаметра сфинктера ануса плода",
  source: "M. Moon et al., 2010",
  clinicalBlock: "anatomy_other",
  tableType: "percentile_by_ga",
  parameter: { id: "analSphincterDiameter", labelRu: "Диаметр сфинктера ануса", unit: "mm" },
  partial: true,
  partialNote: "На карточке видны недели 19–38",
  rows: analRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-26.jpeg",
  verified: false,
});

const raRaw = [
  [14, 2.22, 3.54, 4.87], [15, 2.75, 4.20, 5.65], [16, 3.26, 4.84, 6.42], [17, 3.77, 5.47, 7.17],
  [18, 4.27, 6.09, 7.92], [19, 4.75, 6.70, 8.65], [20, 5.22, 7.29, 9.37], [21, 5.68, 7.88, 10.08],
  [22, 6.13, 8.45, 10.77], [23, 6.56, 9.01, 11.46], [24, 6.99, 9.56, 12.13], [25, 7.40, 10.10, 12.79],
  [26, 7.80, 10.62, 13.44], [27, 8.19, 11.13, 14.08], [28, 8.57, 11.64, 14.70], [29, 8.93, 12.13, 15.32],
  [30, 9.29, 12.61, 15.92], [31, 9.63, 13.07, 16.51], [32, 9.96, 13.53, 17.09], [33, 10.28, 13.97, 17.66],
  [34, 10.59, 14.40, 18.21], [35, 10.88, 14.82, 18.76], [36, 11.17, 15.23, 19.29], [37, 11.44, 15.62, 19.81],
  [38, 11.70, 16.01, 20.32], [39, 11.95, 16.38, 20.82], [40, 12.18, 16.74, 21.30],
];
w("table-2-39.json", {
  tableId: "2.39",
  titleRu: "Нормативные значения ширины правого предсердия сердца плода",
  source: "I. Shapiro et al., 1998",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "rightAtriumWidth", labelRu: "Ширина правого предсердия", unit: "mm" },
  percentileLabels: { low: "p2_5", mid: "p50", high: "p97_5" },
  rows: raRaw.map(([wk, p2_5, p50, p97_5]) => ({ ga: gaWeek(wk), p2_5, p50, p97_5 })),
  sourceCard: "image-26-06-26-04-57-27.jpeg",
  verified: false,
});

w("table-2-21.json", {
  tableId: "2.21",
  titleRu: "Нормативные значения длины носовых костей плода (II триместр)",
  source: "О.И. Козлова, М.В. Медведев, 2008",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  parameter: { id: "nasalBoneLength", labelRu: "Длина носовых костей (ДНК)", unit: "mm" },
  rows: [
    { ga: gaRange(16, 16), p5: 3.9, p50: 4.4, p95: 4.9 },
    { ga: gaRange(17, 17), p5: 4.1, p50: 4.6, p95: 5.1 },
    { ga: gaRange(18, 18), p5: 4.6, p50: 5.2, p95: 5.8 },
    { ga: gaRange(19, 19), p5: 4.9, p50: 5.5, p95: 6.1 },
    { ga: gaRange(20, 20), p5: 5.5, p50: 6.3, p95: 7.1 },
    { ga: gaRange(21, 21), p5: 5.8, p50: 6.6, p95: 7.4 },
    { ga: gaRange(22, 22), p5: 6.1, p50: 6.9, p95: 7.7 },
    { ga: gaRange(23, 23), p5: 6.5, p50: 7.4, p95: 8.3 },
    { ga: gaRange(24, 24), p5: 6.9, p50: 7.9, p95: 8.9 },
    { ga: gaRange(25, 25), p5: 7.2, p50: 8.4, p95: 9.6 },
    { ga: gaRange(26, 26), p5: 7.5, p50: 8.8, p95: 10.1 },
  ],
  sourceCard: "image-26-06-26-04-57-28.jpeg",
  verified: false,
});

w("table-2-4.json", {
  tableId: "2.4",
  titleRu: "Нормативные значения ОЖ в зависимости от срока беременности",
  source: "М.В. Медведев и соавт., 1999",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  ssotDerivedFrom: "biometry-rows.json",
  parameter: { id: "ac", labelRu: "ОЖ (AC)", unit: "mm" },
  rows: ssot.biometry.map((r) => ({
    ga: gaWeek(r.week),
    p5: r.ac.p5,
    p50: r.ac.p50,
    p95: r.ac.p95,
  })),
  sourceCard: "image-26-06-26-04-57-29.jpeg",
  verified: false,
});

const a4Rows = [
  [16, 30, 35, 39, 37, 41, 46, 106, 120, 133, 28, 32, 36, 16, 18, 21],
  [17, 33, 38, 43, 41, 45, 50, 116, 130, 146, 31, 35, 39, 18, 21, 24],
  [18, 36, 41, 46, 45, 49, 54, 127, 142, 157, 34, 39, 43, 20, 23, 26],
  [19, 39, 44, 49, 49, 53, 58, 138, 152, 168, 38, 42, 47, 23, 26, 29],
  [20, 42, 47, 52, 52, 57, 62, 148, 163, 179, 41, 46, 51, 25, 28, 32],
  [21, 45, 50, 55, 56, 61, 66, 159, 174, 190, 45, 50, 55, 28, 31, 34],
  [22, 48, 53, 58, 60, 65, 70, 170, 185, 201, 48, 53, 58, 30, 34, 37],
  [23, 51, 56, 61, 63, 68, 74, 179, 196, 212, 52, 57, 62, 33, 36, 40],
  [24, 54, 59, 64, 67, 72, 78, 190, 207, 223, 55, 60, 66, 35, 39, 42],
  [25, 57, 62, 67, 71, 76, 82, 199, 217, 234, 58, 64, 70, 37, 41, 45],
  [26, 59, 65, 71, 74, 79, 85, 209, 228, 246, 61, 67, 73, 40, 44, 48],
  [27, 62, 68, 74, 77, 83, 89, 218, 238, 257, 65, 71, 77, 42, 46, 51],
  [28, 65, 71, 77, 80, 87, 93, 229, 240, 269, 68, 74, 81, 44, 49, 54],
  [29, 68, 74, 80, 84, 90, 97, 237, 258, 280, 72, 78, 85, 47, 52, 57],
  [30, 71, 77, 83, 86, 93, 100, 246, 268, 290, 75, 81, 89, 50, 54, 60],
  [31, 73, 79, 86, 89, 96, 104, 256, 278, 302, 78, 85, 92, 53, 57, 62],
  [32, 75, 81, 88, 92, 99, 107, 263, 287, 311, 81, 88, 95, 55, 60, 65],
  [33, 76, 83, 90, 94, 102, 110, 270, 294, 319, 84, 91, 99, 57, 62, 67],
  [34, 78, 85, 92, 96, 104, 113, 278, 302, 327, 86, 94, 101, 58, 64, 69],
  [35, 80, 87, 94, 99, 107, 116, 281, 307, 332, 89, 96, 104, 60, 65, 70],
  [36, 81, 89, 95, 101, 109, 118, 295, 312, 338, 91, 99, 107, 61, 66, 71],
  [37, 83, 90, 97, 103, 111, 120, 288, 316, 343, 93, 101, 109, 62, 67, 72],
  [38, 84, 91, 98, 104, 113, 123, 292, 320, 346, 95, 103, 112, 63, 68, 73],
  [39, 85, 92, 100, null, null, null, 295, 324, 350, null, null, null, 63, 68, 73],
];
w("table-A-4.json", {
  tableId: "A.4",
  titleRu: "Региональные нормативы фетометрии (Махачкала, А.М. Эсетов, М.А. Эсетов, 1999)",
  source: "А.М. Эсетов, М.А. Эсетов, Махачкала, 1999",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  partial: true,
  partialNote: "Нед 39: нет ЛЗР и СДЖ на карточке; нед 28 ОГ p50=240 как на JPEG",
  rows: a4Rows.map(([wk, b5, b50, b95, o5, o50, o95, h5, h50, h95, s5, s50, s95, f5, f50, f95]) => {
    const row = {
      ga: gaWeek(wk),
      bpd: band(b5, b50, b95),
      hc: band(h5, h50, h95),
      fl: band(f5, f50, f95),
    };
    if (o50 != null) row.ofd = band(o5, o50, o95);
    if (s50 != null) row.sdz = band(s5, s50, s95);
    return row;
  }),
  sourceCard: "image-26-06-26-04-57-30.jpeg",
  verified: false,
});

const afiRaw = [
  [16, 79, 121, 185], [17, 83, 127, 194], [18, 87, 133, 202], [19, 90, 137, 207], [20, 93, 141, 212],
  [21, 95, 143, 214], [22, 97, 145, 216], [23, 98, 146, 218], [24, 98, 147, 219], [25, 97, 147, 221],
  [26, 97, 147, 223], [27, 95, 146, 226], [28, 94, 146, 228], [29, 92, 145, 231], [30, 90, 145, 234],
  [31, 88, 144, 238], [32, 86, 144, 242], [33, 83, 143, 245], [34, 81, 142, 248], [35, 79, 140, 249],
  [36, 77, 138, 249], [37, 75, 135, 244], [38, 73, 132, 239], [39, 72, 127, 226], [40, 71, 123, 214],
  [41, 70, 116, 194], [42, 69, 110, 175],
];
w("table-2-62.json", {
  tableId: "2.62",
  titleRu: "Показатели индекса амниотической жидкости",
  source: "T. Moore et al., 1990",
  clinicalBlock: "anatomy_other",
  tableType: "percentile_by_ga",
  parameter: { id: "afi", labelRu: "ИАЖ (AFI)", unit: "mm" },
  rows: afiRaw.map(([wk, p5, p50, p95]) => ({ ga: gaWeek(wk), p5, p50, p95 })),
  sourceCard: "image-26-06-26-04-57-31.jpeg",
  verified: false,
});

console.log("Batch 7: 11 new + table-2-69 extended (57-20 … 57-31)");
