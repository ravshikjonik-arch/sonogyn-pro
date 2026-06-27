/**
 * Пост-обработка после batch 8:
 * 1) Полный A.3 (Ярославль 16–42)
 * 2) verified:true для SSOT и согласованных с runtime таблиц
 *
 * Запуск: node scripts/patch-post-archive.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const tablesDir = join(__dir, "../../medvedev-reference/data/archive-tables");

function w(file, data) {
  writeFileSync(join(tablesDir, file), `${JSON.stringify(data, null, 2)}\n`);
  console.log("patched", file);
}

function gaWeek(w) {
  return { weeks: w, days: 0 };
}

function band(p10, p50, p90) {
  return { p10, p50, p90 };
}

const a3Raw = [
  [16, 30, 35, 41, 94, 111, 129, 17, 21, 26], [17, 33, 38, 43, 105, 120, 138, 19, 24, 29],
  [18, 38, 42, 46, 118, 135, 149, 24, 28, 32], [19, 40, 45, 49, 127, 144, 160, 26, 30, 35],
  [20, 43, 48, 52, 137, 154, 170, 29, 33, 37], [21, 46, 50, 54, 146, 163, 179, 32, 36, 39],
  [22, 48, 53, 58, 157, 173, 190, 34, 38, 42], [23, 51, 56, 61, 165, 183, 201, 36, 41, 44],
  [24, 54, 59, 64, 173, 191, 210, 38, 43, 47], [25, 57, 63, 68, 184, 205, 223, 41, 46, 49],
  [26, 59, 65, 71, 190, 212, 234, 43, 48, 52], [27, 63, 69, 75, 204, 226, 250, 46, 51, 56],
  [28, 66, 72, 77, 215, 238, 262, 48, 53, 58], [29, 69, 75, 80, 225, 249, 272, 51, 55, 59],
  [30, 73, 78, 83, 242, 261, 282, 54, 58, 62], [31, 75, 80, 84, 249, 270, 290, 56, 60, 64],
  [32, 77, 82, 86, 257, 279, 300, 58, 62, 65], [33, 79, 84, 88, 267, 288, 309, 60, 63, 67],
  [34, 81, 85, 90, 275, 297, 320, 61, 65, 69], [35, 83, 88, 92, 283, 307, 329, 63, 67, 71],
  [36, 84, 90, 94, 292, 317, 341, 65, 69, 73], [37, 86, 90, 95, 300, 325, 350, 66, 71, 75],
  [38, 88, 92, 96, 311, 337, 364, 69, 73, 77], [39, 89, 93, 97, 319, 343, 369, 70, 74, 78],
  [40, 90, 94, 98, 327, 351, 376, 71, 75, 79], [41, 90, 94, 98, 327, 351, 377, 71, 75, 79],
  [42, 90, 94, 99, 325, 348, 372, 71, 75, 79],
];

w("table-A-3.json", {
  tableId: "A.3",
  titleRu: "Региональные нормативы фетометрии (Ярославль, М.В. Хитров и соавт., 1999)",
  source: "М.В. Хитров, Ярославль, 1999",
  clinicalBlock: "fetometry",
  tableType: "percentile_by_ga",
  percentileLabels: { low: "p10", mid: "p50", high: "p90" },
  rows: a3Raw.map(([wk, b10, b50, b90, a10, a50, a90, f10, f50, f90]) => ({
    ga: gaWeek(wk),
    bpd: band(b10, b50, b90),
    ac: band(a10, a50, a90),
    fl: band(f10, f50, f90),
  })),
  sourceCard: "image-26-06-26-04-57-13.jpeg",
  verified: true,
});

const verifiedIds = new Set([
  "table-2-1.json",
  "table-2-2.json",
  "table-2-3.json",
  "table-2-4.json",
  "table-A-1.json",
  "table-1-2.json",
  "table-1-6.json",
  "table-1-7.json",
  "table-1-8.json",
  "table-2-65.json",
  "table-2-69.json",
  "table-2-70.json",
]);

for (const file of verifiedIds) {
  const path = join(tablesDir, file);
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.verified = true;
  w(file, data);
}

for (const [file, note] of [
  ["table-2-8.json", "Нед 40 нет на JPEG; тимус 2.33/2.34 — только фрагменты на карточках"],
  ["table-2-33.json", "На карточке 18–30 нед; 31–40 нет в архиве JPEG"],
  ["table-2-34.json", "На карточке 19–38 нед; Gamez 2010"],
]) {
  const path = join(tablesDir, file);
  const data = JSON.parse(readFileSync(path, "utf8"));
  if (data.partial) data.partialNote = note;
  w(file, data);
}

console.log("Post-archive patch done");
