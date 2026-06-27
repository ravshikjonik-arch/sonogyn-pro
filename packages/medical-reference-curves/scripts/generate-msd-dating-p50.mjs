/**
 * table-1-1.json (MSD p50) → medical-calculations/src/data/msd-medvedev-11-p50.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const table = JSON.parse(
  readFileSync(join(__dir, "../../medvedev-reference/data/archive-tables/table-1-1.json"), "utf8"),
);
const points = table.rows.map((r) => [r.msdMm, r.gaP50.weeks * 7 + r.gaP50.days]);
const out = {
  source: "Medvedev table 1.1 (Grisolia 1993), gaP50 inverse",
  minMsd: points[0][0],
  maxMsd: points.at(-1)[0],
  points,
};
const dest = join(__dir, "../../medical-calculations/src/data/msd-medvedev-11-p50.json");
writeFileSync(dest, `${JSON.stringify(out, null, 2)}\n`);
console.log("wrote", dest);
