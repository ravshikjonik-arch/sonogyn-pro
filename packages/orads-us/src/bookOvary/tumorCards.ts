import { ORADS_BOOK_PHOTOCARDS, ORADS_BOOK_TUMOR_CARDS } from "./data";
import type { OradsBookPhotocard, OradsBookTumorCard } from "./types";

export function listOradsBookTumorCards(): OradsBookTumorCard[] {
  return ORADS_BOOK_TUMOR_CARDS.tumors;
}

export function getOradsBookTumorCard(id: string): OradsBookTumorCard | undefined {
  return ORADS_BOOK_TUMOR_CARDS.tumors.find((t) => t.id === id);
}

export function listOradsBookTumorGroups(): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const t of ORADS_BOOK_TUMOR_CARDS.tumors) {
    if (!seen.has(t.group)) {
      seen.add(t.group);
      groups.push(t.group);
    }
  }
  return groups;
}

function haystack(card: OradsBookTumorCard): string {
  return [card.id, card.name, card.group, card.age, card.laterality, card.appearance, card.typical_features, card.color_score]
    .join(" ")
    .toLowerCase();
}

/** Поиск по имени, группе, маркерам, УЗ-виду, ЦДК. */
export function searchOradsBookTumorCards(query: string, group?: string): OradsBookTumorCard[] {
  const q = query.trim().toLowerCase();
  return ORADS_BOOK_TUMOR_CARDS.tumors.filter((card) => {
    if (group && card.group !== group) return false;
    if (!q) return true;
    return haystack(card).includes(q);
  });
}

export function getPhotocardsForTumor(tumorId: string): OradsBookPhotocard[] {
  return ORADS_BOOK_PHOTOCARDS.cards.filter((c) => c.relatedTumorIds?.includes(tumorId));
}

export function resolveOradsBookPhotocardSrc(file: string): string {
  const base = ORADS_BOOK_PHOTOCARDS.publicBase.replace(/\/$/, "");
  return `${base}/${file}`;
}
