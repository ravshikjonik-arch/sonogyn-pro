/**
 * Генератор JSON-кривых из SSOT таблицы Медведев 2016 (Прил. 1, мозг).
 * p50 → mean; sd = (p95 − p5) / 3.29  (нормальное распределение, z±1.645).
 *
 * Источник цифр: packages/medvedev-reference/data/biometry-rows.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const ssotPath = join(root, "../medvedev-reference/data/biometry-rows.json");

const { biometry: BIOMETRY_ROWS, brain: BRAIN_ROWS, source, brainSource } = JSON.parse(
  readFileSync(ssotPath, "utf8"),
);

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

const SOURCE = source ?? "Медведев М.В. Пренатальная эхография, 2016. Прил. 1 (Медведев и соавт., 1999).";
const BRAIN_SOURCE = brainSource ?? `${SOURCE} Таблица мозга, стр. 622.`;

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
    source: BRAIN_SOURCE,
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
  primarySources: [SOURCE, BRAIN_SOURCE],
});

console.log("Generated biometry + brain curves from", ssotPath);
