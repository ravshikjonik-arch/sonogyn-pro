/**
 * Синхронизирует catalog.json с извлечёнными table-*.json (по полю sourceCard).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const tablesDir = join(__dir, "../../medvedev-reference/data/archive-tables");
const catalogPath = join(tablesDir, "catalog.json");

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const tableFiles = readdirSync(tablesDir).filter((f) => f.startsWith("table-") && f.endsWith(".json"));

/** filename → [{ tableId, dataFile, ... }] */
const byCard = new Map();

for (const file of tableFiles) {
  const data = JSON.parse(readFileSync(join(tablesDir, file), "utf8"));
  const cards = String(data.sourceCard ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const card of cards) {
    if (!byCard.has(card)) byCard.set(card, []);
    byCard.get(card).push({
      tableId: data.tableId,
      titleRu: data.titleRu,
      clinicalBlock: data.clinicalBlock,
      tableType: data.tableType,
      dataFile: file,
      partial: data.partial === true,
      verified: data.verified === true,
    });
  }
}

let extracted = 0;
let pending = 0;

for (const card of catalog.cards) {
  const hits = byCard.get(card.filename) ?? [];
  if (hits.length === 0) {
    card.extractionStatus = "pending";
    pending++;
    continue;
  }
  extracted++;
  const primary = hits[0];
  card.tableId = hits.length === 1 ? primary.tableId : hits.map((h) => h.tableId).join("+");
  card.titleRu = primary.titleRu;
  card.clinicalBlock = primary.clinicalBlock;
  card.tableType = primary.tableType;
  card.dataFile = hits.map((h) => h.dataFile).join(", ");
  card.extractionStatus = hits.some((h) => h.partial) ? "partial" : "extracted";
  card.verified = hits.every((h) => h.verified);
  if (hits.length > 1) card.multiTable = hits.map((h) => h.tableId);
}

catalog.stats = {
  extractedCards: extracted,
  pendingCards: pending,
  tableJsonCount: tableFiles.length,
  updatedAt: new Date().toISOString(),
};

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`Catalog synced: ${extracted}/${catalog.totalCards} cards, ${tableFiles.length} table JSON`);
