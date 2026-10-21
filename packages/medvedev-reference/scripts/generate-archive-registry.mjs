/**
 * Generates src/archiveTableRegistry.generated.ts — static JSON bundle for archive calculators.
 * Run: node scripts/generate-archive-registry.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dir, "..");
const tablesDir = path.join(pkgRoot, "data/archive-tables");
const outFile = path.join(pkgRoot, "src/archiveTableRegistry.generated.ts");

const files = fs
  .readdirSync(tablesDir)
  .filter((f) => f.startsWith("table-") && f.endsWith(".json"))
  .sort();

const imports = files.map((f, i) => {
  const varName = `t${i}`;
  return `import ${varName} from "../data/archive-tables/${f}";`;
});

const entries = files.map((f, i) => {
  const j = JSON.parse(fs.readFileSync(path.join(tablesDir, f), "utf8"));
  const tableId = j.tableId ?? f.replace(/^table-|-/g, ".");
  return `  "${tableId}": t${i},`;
});

const body = `/** AUTO-GENERATED — node scripts/generate-archive-registry.mjs */
/* eslint-disable @typescript-eslint/no-explicit-any */

${imports.join("\n")}

import type { ArchiveTableDocument } from "./archiveTableTypes";

export const ARCHIVE_TABLES_BY_ID: Record<string, ArchiveTableDocument> = {
${entries.join("\n")}
};

export const ARCHIVE_TABLE_IDS = Object.keys(ARCHIVE_TABLES_BY_ID);
`;

fs.writeFileSync(outFile, body, "utf8");
console.log(`Wrote ${outFile} (${files.length} tables)`);
