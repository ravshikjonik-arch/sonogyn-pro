/**
 * Генерация inverse CRL p50 → GA из archive table-1-2.json
 * → packages/medical-calculations/src/data/crl-medvedev-12-p50.json
 *
 * Запуск: node scripts/generate-crl-dating-p50.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "../..");
const src = join(root, "medvedev-reference/data/archive-tables/table-1-2.json");
const out = join(root, "medical-calculations/src/data/crl-medvedev-12-p50.json");

const table = JSON.parse(readFileSync(src, "utf8"));
const pts = table.rows
  .map((r) => ({ crl: r.crlP50, days: r.ga.weeks * 7 + r.ga.days }))
  .sort((a, b) => a.crl - b.crl);

const points = [];
let last = -1;
for (const p of pts) {
  if (p.crl !== last) {
    points.push([p.crl, p.days]);
    last = p.crl;
  }
}

const payload = {
  source: "Medvedev table 1.2 (Altynnik 2001), p50 inverse",
  minCrl: points[0][0],
  maxCrl: points[points.length - 1][0],
  points,
};

writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${out} (${points.length} p50 points, ${payload.minCrl}–${payload.maxCrl} mm)`);
