import { ORADS_BOOK_CATEGORIES } from "./data";
import type { OradsBookCategory, OradsBookTypicalBenign } from "./types";

export function listOradsBookCategories(): OradsBookCategory[] {
  return ORADS_BOOK_CATEGORIES.categories;
}

export function getOradsBookCategory(orads: number): OradsBookCategory | undefined {
  return ORADS_BOOK_CATEGORIES.categories.find((c) => c.orads === orads);
}

export function listOradsBookTypicalBenign(): OradsBookTypicalBenign[] {
  return ORADS_BOOK_CATEGORIES.typical_benign;
}

export function listOradsBook2022Principles(): string[] {
  return ORADS_BOOK_CATEGORIES.orads_2022_principles;
}

export function getOradsBookAdnexMapping(): Record<string, string> {
  return ORADS_BOOK_CATEGORIES.adnex_model.orads_mapping;
}

export function getOradsBookFootnotes(): Record<string, string> {
  return ORADS_BOOK_CATEGORIES.footnotes ?? {};
}
