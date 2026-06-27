/**
 * Валидация archive-tables: порядок GA, p5≤p50≤p95, SSOT-зеркала 2.1/A.1.
 * Запуск: node scripts/validate-archive-tables.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const tablesDir = join(__dir, "../../medvedev-reference/data/archive-tables");
const ssot = JSON.parse(readFileSync(join(tablesDir, "../biometry-rows.json"), "utf8"));

let errors = 0;

function fail(msg) {
  console.error("❌", msg);
  errors++;
}

function gaSortKey(row) {
  if (typeof row.gaDaysFromLmp === "number") return row.gaDaysFromLmp;
  if (typeof row.msdMm === "number") return row.msdMm;
  if (typeof row.crlMm === "number") return row.crlMm;
  if (typeof row.ribLengthMm === "number") return row.ribLengthMm;
  if (row.ga?.weeks != null) return row.ga.weeks * 7 + (row.ga.days ?? 0);
  if (row.ga?.from?.weeks != null) return row.ga.from.weeks * 7 + (row.ga.from.days ?? 0);
  return null;
}

function checkBand(b, ctx) {
  if (!b) return;
  const keys = Object.keys(b).filter((k) => typeof b[k] === "number");
  if (keys.includes("p5") && keys.includes("p50") && keys.includes("p95")) {
    if (b.p5 > b.p50) fail(`${ctx}: p5 > p50`);
    if (b.p50 > b.p95) fail(`${ctx}: p50 > p95`);
  }
}

const files = readdirSync(tablesDir).filter((f) => f.startsWith("table-") && f.endsWith(".json"));

for (const file of files) {
  const data = JSON.parse(readFileSync(join(tablesDir, file), "utf8"));
  if (!Array.isArray(data.rows)) continue;

  let prevSort = -1;
  for (const row of data.rows) {
    const sortKey = gaSortKey(row);
    const gk = sortKey == null ? "?" : String(sortKey);
    if (sortKey != null && sortKey <= prevSort && row.msdMm == null && row.crlMm == null && row.ribLengthMm == null) {
      fail(`${file}: ось не монотонна ${prevSort} → ${sortKey}`);
    }
    if (sortKey != null) prevSort = sortKey;

    for (const [k, v] of Object.entries(row)) {
      if (v && typeof v === "object" && ("p5" in v || "p50" in v || "p95" in v)) {
        checkBand(v, `${file} ${gk}.${k}`);
      }
    }
    if (typeof row.p5 === "number" && typeof row.p50 === "number" && row.p95 == null && row.p5 > row.p50) {
      fail(`${file} ${gk}: p5 > p50`);
    }
    if (typeof row.p5 === "number" && typeof row.p50 === "number" && typeof row.p95 === "number") {
      checkBand(row, `${file} ${gk}`);
    }
  }

  if (data.ssotDerivedFrom === "biometry-rows.json" && data.tableId === "2.1") {
    for (const row of data.rows) {
      const ss = ssot.biometry.find((b) => b.week === row.ga.weeks);
      if (!ss) fail(`${file}: нет недели ${row.ga.weeks} в SSOT`);
      else if (row.p50 !== ss.bpd.p50) fail(`${file} week ${row.ga.weeks} BPD p50 ${row.p50} ≠ SSOT ${ss.bpd.p50}`);
    }
  }

  if (data.ssotDerivedFrom === "biometry-rows.json" && data.tableId === "2.2") {
    for (const row of data.rows) {
      const ss = ssot.biometry.find((b) => b.week === row.ga.weeks);
      if (!ss) fail(`${file}: нет недели ${row.ga.weeks} в SSOT`);
      else if (row.p50 !== ss.ofd.p50) fail(`${file} week ${row.ga.weeks} OFD p50 ${row.p50} ≠ SSOT ${ss.ofd.p50}`);
    }
  }

  if (data.ssotDerivedFrom === "biometry-rows.json" && data.tableId === "A.1") {
    for (const row of data.rows) {
      const ss = ssot.biometry.find((b) => b.week === row.ga.weeks);
      if (!ss) fail(`${file}: нет недели ${row.ga.weeks} в SSOT`);
      else {
        for (const k of ["bpd", "ofd", "hc", "ac", "fl", "hl"]) {
          if (row[k]?.p50 !== ss[k]?.p50) {
            fail(`${file} week ${row.ga.weeks}.${k} p50 mismatch SSOT`);
          }
        }
      }
    }
  }

  if (data.tableId === "1.3") {
    const days = data.rows.map((r) => r.gaDaysFromLmp);
    if (days[0] !== 31 || days[days.length - 1] !== 66) {
      fail(`${file}: gaDaysFromLmp должен быть 31–66, got ${days[0]}–${days[days.length - 1]}`);
    }
    for (let i = 1; i < days.length; i++) {
      if (days[i] !== days[i - 1] + 1) fail(`${file}: пропуск в gaDaysFromLmp ${days[i - 1]}→${days[i]}`);
    }
  }

  if (data.tableId === "1.11") {
    const crls = data.rows.map((r) => r.crlMm);
    if (crls[0] !== 1 || crls[crls.length - 1] !== 40) {
      fail(`${file}: crlMm должен быть 1–40, got ${crls[0]}–${crls[crls.length - 1]}`);
    }
    for (let i = 1; i < crls.length; i++) {
      if (crls[i] !== crls[i - 1] + 1) fail(`${file}: пропуск crlMm ${crls[i - 1]}→${crls[i]}`);
    }
  }

  if (data.tableId === "1.6") {
    let prevTo = 0;
    for (const row of data.rows) {
      if (row.crlMmFrom <= prevTo) fail(`${file}: перекрытие CRL ${row.crlMmFrom}–${row.crlMmTo}`);
      if (row.crlMmTo < row.crlMmFrom) fail(`${file}: crlMmTo < crlMmFrom`);
      prevTo = row.crlMmTo;
    }
    if (data.rows[0].crlMmFrom !== 45 || prevTo !== 84) {
      fail(`${file}: диапазоны КТР должны покрывать 45–84 мм`);
    }
  }

  if (data.tableId === "2.64" && !data.partial) {
    const weeks = data.rows.map((r) => r.ga.weeks);
    if (weeks[0] !== 14 || weeks[weeks.length - 1] !== 40) {
      fail(`${file}: UA RI недели 14–40, got ${weeks[0]}–${weeks[weeks.length - 1]}`);
    }
  }
}

if (errors) {
  console.error(`\n${errors} ошибок в archive-tables`);
  process.exit(1);
}
console.log(`✅ archive-tables: ${files.length} JSON, SSOT-зеркала 2.1/2.2/A.1 совпадают`);
