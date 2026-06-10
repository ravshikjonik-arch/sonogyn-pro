import { CERVIX_EVIDENCE } from "./cervix/entries";
import { ENDOCRINE_EVIDENCE } from "./endocrine/entries";
import { MAMMO_EVIDENCE } from "./mammo/entries";
import { OBGYN_EVIDENCE } from "./obgyn/entries";
import { ONCO_EVIDENCE } from "./onco/entries";
import { SURGERY_EVIDENCE } from "./surgery/entries";
import { US_FMF_EVIDENCE } from "./us-fmf/entries";
import type { EvidenceEntry, EvidenceShelf } from "./types";

export type {
  EvidenceEntry,
  EvidenceRelatedLink,
  EvidenceShelf,
  EvidenceSource,
  EvidenceTier,
} from "./types";
export { EVIDENCE_DISCLAIMER, EVIDENCE_SHELVES, getShelfMeta } from "./shelves";
export type { EvidenceShelfMeta } from "./shelves";
export { US_FMF_EVIDENCE, FMF_TOPIC_COUNT } from "./us-fmf/entries";
export { OBGYN_EVIDENCE, OBGYN_TOPIC_COUNT } from "./obgyn/entries";
export { CERVIX_EVIDENCE, CERVIX_TOPIC_COUNT } from "./cervix/entries";
export { MAMMO_EVIDENCE, MAMMO_TOPIC_COUNT } from "./mammo/entries";
export { ONCO_EVIDENCE, ONCO_TOPIC_COUNT } from "./onco/entries";
export { ENDOCRINE_EVIDENCE, ENDOCRINE_TOPIC_COUNT } from "./endocrine/entries";
export { SURGERY_EVIDENCE, SURGERY_TOPIC_COUNT } from "./surgery/entries";
export { FMF_MODULE_INDEX } from "./us-fmf/fmf-modules";

/** Все одобренные записи (7 полок). */
export const EVIDENCE_ENTRIES: EvidenceEntry[] = [
  ...US_FMF_EVIDENCE,
  ...OBGYN_EVIDENCE,
  ...CERVIX_EVIDENCE,
  ...MAMMO_EVIDENCE,
  ...ONCO_EVIDENCE,
  ...ENDOCRINE_EVIDENCE,
  ...SURGERY_EVIDENCE,
];

export function getEvidenceEntryById(id: string): EvidenceEntry | undefined {
  return EVIDENCE_ENTRIES.find((e) => e.id === id);
}

export function listEvidenceByShelf(shelf: EvidenceShelf): EvidenceEntry[] {
  return EVIDENCE_ENTRIES.filter((e) => e.shelf === shelf);
}

export const EVIDENCE_CORPUS_VERSION = "1.0.0-complete";
