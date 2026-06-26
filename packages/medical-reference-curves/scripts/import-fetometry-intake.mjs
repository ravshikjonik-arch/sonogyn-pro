/**
 * Импорт fetometry-intake.json → biometry-rows.json (SSOT) + regenerate curves.
 *
 * 1. Скопируйте data/fetometry-intake.template.json → data/fetometry-intake.json
 * 2. Заполните недели/показатели (можно частично — merge по week)
 * 3. npm run import:intake
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const intakePath = join(root, "data/fetometry-intake.json");
const ssotPath = join(root, "../medvedev-reference/data/biometry-rows.json");

if (!existsSync(intakePath)) {
  console.error("Нет файла data/fetometry-intake.json");
  console.error("Скопируйте data/fetometry-intake.template.json и заполните.");
  process.exit(1);
}

const intake = JSON.parse(readFileSync(intakePath, "utf8"));
const ssot = existsSync(ssotPath)
  ? JSON.parse(readFileSync(ssotPath, "utf8"))
  : { version: 1, biometry: [], brain: [] };

function mergeByWeek(target, incoming, label) {
  const map = new Map(target.map((r) => [r.week, { ...r }]));
  for (const row of incoming ?? []) {
    const prev = map.get(row.week) ?? { week: row.week };
    map.set(row.week, { ...prev, ...row, week: row.week });
  }
  const out = [...map.values()].sort((a, b) => a.week - b.week);
  console.log(`${label}: ${incoming?.length ?? 0} строк intake → ${out.length} недель в SSOT`);
  return out;
}

ssot.biometry = mergeByWeek(ssot.biometry, intake.biometry, "biometry");
ssot.brain = mergeByWeek(ssot.brain ?? [], intake.brain, "brain");
if (intake.sourceNote) ssot.lastImportNote = intake.sourceNote;

writeFileSync(ssotPath, JSON.stringify(ssot, null, 2) + "\n");
console.log("Записано:", ssotPath);

const validate = spawnSync("node", ["scripts/validate-fetometry-data.mjs", ssotPath], {
  cwd: root,
  stdio: "inherit",
});
if (validate.status !== 0) process.exit(validate.status ?? 1);

const generate = spawnSync("node", ["scripts/generate-from-medvedev.mjs"], {
  cwd: root,
  stdio: "inherit",
});
process.exit(generate.status ?? 0);
