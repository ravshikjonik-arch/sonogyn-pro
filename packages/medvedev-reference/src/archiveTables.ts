/**
 * Каталог archive-tables (96 JPEG → JSON).
 * Runtime-оценки I скрининга: medvedevFirstTrimester (≈ archive 1.6–1.8).
 * Фетометрия II/III SSOT: biometry-rows + archive 2.1–2.4.
 */
import catalog from "../data/archive-tables/catalog.json";

export type ArchiveCatalog = typeof catalog;

export const ARCHIVE_CATALOG = catalog;

export function archiveStats() {
  return catalog.stats;
}

export function listArchiveTableFiles(): string[] {
  return catalog.cards
    .map((c) => c.dataFile)
    .filter((f): f is string => typeof f === "string");
}

export function findArchiveCardByTableId(tableId: string) {
  return catalog.cards.find((c) => c.tableId === tableId);
}
