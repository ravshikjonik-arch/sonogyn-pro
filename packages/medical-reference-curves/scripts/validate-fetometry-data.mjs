/**
 * Валидация SSOT таблицы фетометрии (p5/p50/p95 по неделям).
 * Запуск: node scripts/validate-fetometry-data.mjs [path/to/biometry-rows.json]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const defaultPath = join(__dir, "../../medvedev-reference/data/biometry-rows.json");
const path = process.argv[2] ?? defaultPath;

const BIOMETRY_KEYS = ["bpd", "ofd", "hc", "ac", "fl", "hl"];
const BRAIN_KEYS = ["lateralVentricle", "cisternaMagna", "cerebellumTransverse"];

function fail(msg) {
  console.error("❌", msg);
  process.exitCode = 1;
}

function warn(msg) {
  console.warn("⚠️", msg);
}

function checkBand(band, ctx) {
  if (!band || typeof band !== "object") {
    fail(`${ctx}: нет band`);
    return;
  }
  for (const k of ["p5", "p50", "p95"]) {
    if (typeof band[k] !== "number" || !Number.isFinite(band[k])) {
      fail(`${ctx}.${k}: ожидается число`);
    }
  }
  if (band.p5 >= band.p50) fail(`${ctx}: p5 (${band.p5}) >= p50 (${band.p50})`);
  if (band.p50 >= band.p95) fail(`${ctx}: p50 (${band.p50}) >= p95 (${band.p95})`);
}

function checkMonotonicP50(rows, key, group) {
  let prev = null;
  for (const row of rows) {
    const band = row[key];
    if (!band) continue;
    if (prev != null && band.p50 < prev) {
      warn(`${group} ${key} week ${row.week}: p50 ${band.p50} < предыдущая неделя ${prev}`);
    }
    prev = band.p50;
  }
}

const raw = JSON.parse(readFileSync(path, "utf8"));
if (!Array.isArray(raw.biometry) || raw.biometry.length === 0) {
  fail("biometry: пустой массив");
}

const weeks = new Set();
for (const row of raw.biometry) {
  if (typeof row.week !== "number") fail(`biometry: week не число`);
  if (weeks.has(row.week)) fail(`biometry: дубликат недели ${row.week}`);
  weeks.add(row.week);
  for (const key of BIOMETRY_KEYS) {
    checkBand(row[key], `biometry week ${row.week}.${key}`);
  }
}

if (Array.isArray(raw.brain)) {
  for (const row of raw.brain) {
    if (typeof row.week !== "number") fail(`brain: week не число`);
    for (const key of BRAIN_KEYS) {
      if (row[key]) checkBand(row[key], `brain week ${row.week}.${key}`);
    }
  }
}

for (const key of BIOMETRY_KEYS) checkMonotonicP50(raw.biometry, key, "biometry");
for (const key of BRAIN_KEYS) checkMonotonicP50(raw.brain ?? [], key, "brain");

if (process.exitCode) {
  console.error(`\nПроверка ${path} — ошибки.`);
} else {
  console.log(`✅ ${path}: ${raw.biometry.length} недель фетометрии, ${(raw.brain ?? []).length} недель мозга`);
}
