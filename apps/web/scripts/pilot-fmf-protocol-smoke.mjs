#!/usr/bin/env node
/** T3 — FMF protocol SOURCE strings: no author FIO (read files, no TS resolve). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const files = [
  "packages/medvedev-reference/src/medvedevBiometry.ts",
  "packages/medvedev-reference/src/medvedevFirstTrimester.ts",
  "packages/medvedev-reference/src/medvedevDoppler.ts",
];
const bad = /(Солнцев|Озерск|Медведев М\.|автор)/i;
let failed = 0;
for (const rel of files) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  const matches = [...text.matchAll(/export const MEDVEDEV_[A-Z0-9_]+_SOURCE\s*=\s*\n?\s*"([^"]+)"/g)];
  for (const m of matches) {
    const s = m[1];
    if (bad.test(s)) {
      console.log("❌", rel, s);
      failed += 1;
    } else {
      console.log("✅", s);
    }
  }
}
// mobile FMF screen exists
const screen = path.join(root, "apps/mobile/src/features/fmf/screens/FMFAssistantScreen.tsx");
if (fs.existsSync(screen)) console.log("✅ mobile FMFAssistantScreen");
else {
  console.log("❌ mobile FMF screen missing");
  failed += 1;
}
process.exit(failed ? 1 : 0);
