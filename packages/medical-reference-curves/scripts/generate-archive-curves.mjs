/**
 * Wire archive-tables → medical-reference-curves JSON (percentile engines).
 *
 * Запуск: node scripts/generate-archive-curves.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const tablesDir = join(root, "../medvedev-reference/data/archive-tables");

function writeCurve(relPath, curve) {
  const path = join(root, relPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(curve, null, 2)}\n`);
  console.log("wrote", relPath);
}

function gaRowsToAnchors(rows, valueKey = "p50") {
  return rows
    .filter((r) => r.ga?.weeks != null && typeof r[valueKey] === "number")
    .map((r) => {
      const p5 = r.p5 ?? r.p2_5 ?? r.p10;
      const p95 = r.p95 ?? r.p97_5 ?? r.p90;
      const p50 = r[valueKey];
      const sd = p5 != null && p95 != null ? Math.round(((p95 - p5) / 3.29) * 1000) / 1000 : 0.5;
      return { gaWeeks: r.ga.weeks, mean: p50, sd };
    });
}

const lv8 = JSON.parse(readFileSync(join(tablesDir, "table-2-8.json"), "utf8"));
writeCurve("brain/lateral_ventricle_body.json", {
  id: "lateral_ventricle_body",
  label: "Lateral ventricle body width",
  labelRu: "Ширина тела бокового желудочка",
  engine: "medvedev_archive",
  source: lv8.source,
  archiveTableId: "2.8",
  unit: "mm",
  xAxis: { type: "gaWeeks", min: lv8.rows[0].ga.weeks, max: lv8.rows.at(-1).ga.weeks },
  model: { type: "mean_sd_anchors", anchors: gaRowsToAnchors(lv8.rows) },
  percentileDisplay: [5, 50, 95],
  supportsGrowthVelocity: false,
  partial: lv8.partial === true,
});

const msdTable = JSON.parse(readFileSync(join(tablesDir, "table-1-1.json"), "utf8"));
const msdAnchors = msdTable.rows.map((r) => ({
  gaDays: r.gaP50.weeks * 7 + r.gaP50.days,
  mean: r.msdMm,
  sd: Math.max(0.3, ((r.msdMm * 0.15) || 1)),
}));
writeCurve("early/msd_dating_inverse.json", {
  id: "msd_dating",
  label: "Gestational sac (MSD) dating",
  labelRu: "СВД → срок (табл. 1.1 Grisolia)",
  engine: "medvedev_archive",
  source: msdTable.source,
  archiveTableId: "1.1",
  unit: "mm",
  xAxis: { type: "gaDays", min: msdAnchors[0].gaDays, max: msdAnchors.at(-1).gaDays },
  model: { type: "mean_sd_anchors", anchors: msdAnchors },
  inverseAxis: "msdMm",
  supportsGaFromValue: true,
});

console.log("Archive curves synced");
