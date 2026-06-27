/**
 * Индекс 96 JPEG → catalog.json (filename, pending extraction).
 * После OCR/vision: tableId, titleRu, block, tableType заполняются в tables/*.json
 */
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, "../../..");
const archiveDir = join(repoRoot, "docs/fetometry-source/medvedev-archive");
const outDir = join(repoRoot, "packages/medvedev-reference/data/archive-tables");
const catalogPath = join(outDir, "catalog.json");

mkdirSync(outDir, { recursive: true });

const files = readdirSync(archiveDir)
  .filter((f) => f.endsWith(".jpeg"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const catalog = {
  version: 1,
  sourceBook: "Медведев М.В. Основы ультразвуковой фетометрии, 2016",
  totalCards: files.length,
  cards: files.map((filename, index) => ({
    cardIndex: index + 1,
    filename,
    imagePath: `docs/fetometry-source/medvedev-archive/${filename}`,
    tableId: null,
    titleRu: null,
    clinicalBlock: null,
    tableType: null,
    extractionStatus: "pending",
    dataFile: null,
  })),
};

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`Catalog: ${files.length} cards → ${catalogPath}`);
