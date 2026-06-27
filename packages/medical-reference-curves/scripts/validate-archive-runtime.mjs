/**
 * Сверка archive JSON ↔ runtime (medvedevFirstTrimester NT/1.7, SSOT).
 * Запуск: node scripts/validate-archive-runtime.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const tablesDir = join(__dir, "../../medvedev-reference/data/archive-tables");
const ssot = JSON.parse(readFileSync(join(tablesDir, "../biometry-rows.json"), "utf8"));

const ntArchive = JSON.parse(readFileSync(join(tablesDir, "table-1-7.json"), "utf8"));
const ntRuntime = [
  [45, 50, 0.74, 1.52, 2.3],
  [51, 55, 0.76, 1.54, 2.32],
  [56, 60, 0.78, 1.56, 2.34],
  [61, 65, 0.81, 1.59, 2.37],
  [66, 70, 0.83, 1.61, 2.39],
  [71, 75, 0.85, 1.63, 2.41],
  [76, 80, 0.87, 1.65, 2.43],
  [81, 84, 0.89, 1.67, 2.45],
];

let errors = 0;
for (const row of ntArchive.rows) {
  const exp = ntRuntime.find(([from, to]) => row.crlMmFrom === from && row.crlMmTo === to);
  if (!exp) {
    console.error("❌ NT range missing", row.crlMmFrom, row.crlMmTo);
    errors++;
    continue;
  }
  if (row.p50 !== exp[3]) {
    console.error(`❌ NT p50 ${row.crlMmFrom}–${row.crlMmTo}: archive ${row.p50} ≠ runtime ${exp[3]}`);
    errors++;
  }
}

for (const tableId of ["2.1", "2.2", "2.3", "2.4"]) {
  const file = join(tablesDir, `table-${tableId.replace(".", "-")}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  const key = tableId === "2.1" ? "bpd" : tableId === "2.2" ? "ofd" : tableId === "2.3" ? "hc" : "ac";
  for (const row of data.rows) {
    const ss = ssot.biometry.find((b) => b.week === row.ga.weeks);
    if (ss && row.p50 !== ss[key].p50) {
      console.error(`❌ ${tableId} week ${row.ga.weeks} p50 mismatch SSOT`);
      errors++;
    }
  }
}

if (errors) {
  console.error(`\n${errors} runtime/archive расхождений`);
  process.exit(1);
}
console.log("✅ archive ↔ runtime: NT 1.7, SSOT 2.1–2.4 совпадают");
