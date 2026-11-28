import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const SCAN_ROOTS = [
  "apps/web/components/clinical-assistant",
  "apps/web/lib/clinical-assistant",
  "apps/mobile/src/features/fmf",
  "packages/prenatal-guided-protocol/src",
  "packages/medvedev-reference/src",
];

const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /Длина носа/i, reason: "use «ДНК / носовая кость» only in I trim." },
  { pattern: /Кость носа/i, reason: "use «Носовые кости» in protocols." },
  { pattern: /пол плода/i, reason: "use «внешние половые признаки по УЗИ (фенотип)»." },
  { pattern: /Стабильность положения/i, reason: "use «изменчивость предлежания»." },
  { pattern: /\bИР АП\b/, reason: "use «RI АП (индекс резистентности)»." },
  { pattern: /ИР артерии пуповины/, reason: "use RI (resistance index)." },
];

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
}

describe("obstetric protocol terminology audit", () => {
  it("product paths avoid deprecated Russian protocol strings", () => {
    const hits: string[] = [];
    for (const rel of SCAN_ROOTS) {
      const dir = join(ROOT, rel);
      const files: string[] = [];
      try {
        walk(dir, files);
      } catch {
        continue;
      }
      for (const file of files) {
        const text = readFileSync(file, "utf8");
        for (const rule of FORBIDDEN) {
          if (rule.pattern.test(text)) {
            hits.push(`${file.replace(ROOT + "/", "")}: ${rule.reason}`);
          }
        }
      }
    }
    assert.deepEqual(hits, []);
  });
});