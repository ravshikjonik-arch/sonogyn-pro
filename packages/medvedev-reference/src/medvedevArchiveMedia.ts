/**
 * Публичные JPEG карточек книги «Основы ультразвуковой фетометрии» (2016).
 * SSOT метаданных: data/archive-tables/catalog.json
 */
import { ARCHIVE_CATALOG, findArchiveCardByTableId } from "./archiveTables";

/** Путь в apps/web/public — после `pnpm sync:archive-images` */
export const MEDVEDEV_ARCHIVE_PUBLIC_BASE = "/clinical/medvedev-archive";

export type MedvedevArchiveStructuredCard = {
  cardIndex: number;
  tableId: string;
  titleRu: string;
  clinicalBlock: string;
  tableType: string;
  extractionStatus: string;
  filename: string;
  imageSrc: string;
  dataFile?: string;
  multiTable?: string[];
  verified: boolean;
  sourceBook: string;
};

export function getMedvedevArchivePublicImageSrc(filename: string): string {
  return `${MEDVEDEV_ARCHIVE_PUBLIC_BASE}/${encodeURIComponent(filename)}`;
}

export function getMedvedevArchiveImageByTableId(tableId: string): string | undefined {
  const card = findArchiveCardByTableId(tableId);
  if (!card?.filename) return undefined;
  return getMedvedevArchivePublicImageSrc(card.filename);
}

/** Полный структурированный каталог 96 карточек (книга → JPEG → JSON). */
export function listMedvedevArchiveStructuredCards(): MedvedevArchiveStructuredCard[] {
  const book = ARCHIVE_CATALOG.sourceBook;
  return ARCHIVE_CATALOG.cards.map((c) => ({
    cardIndex: c.cardIndex,
    tableId: c.tableId,
    titleRu: c.titleRu,
    clinicalBlock: c.clinicalBlock,
    tableType: c.tableType,
    extractionStatus: c.extractionStatus,
    filename: c.filename,
    imageSrc: getMedvedevArchivePublicImageSrc(c.filename),
    dataFile: typeof c.dataFile === "string" ? c.dataFile : undefined,
    multiTable: "multiTable" in c && Array.isArray(c.multiTable) ? c.multiTable : undefined,
    verified: c.verified === true,
    sourceBook: book,
  }));
}

export function medvedevArchiveBookStats() {
  const cards = ARCHIVE_CATALOG.cards;
  const byBlock: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const c of cards) {
    byBlock[c.clinicalBlock] = (byBlock[c.clinicalBlock] ?? 0) + 1;
    byStatus[c.extractionStatus] = (byStatus[c.extractionStatus] ?? 0) + 1;
  }
  return {
    sourceBook: ARCHIVE_CATALOG.sourceBook,
    totalCards: ARCHIVE_CATALOG.totalCards ?? cards.length,
    byBlock,
    byStatus,
    stats: ARCHIVE_CATALOG.stats,
  };
}
