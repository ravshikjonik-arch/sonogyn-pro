import { BIRADS_CATEGORIES, type BiradsCategoryCode } from "./categories";
import { BIRADS_PATHOLOGY_LIBRARY, type BiradsPathologyEntry } from "./differential";

export type BiradsAtlasCategoryTab = BiradsCategoryCode;

export function atlasCategoryTabs(): typeof BIRADS_CATEGORIES {
  return BIRADS_CATEGORIES;
}

export function pathologyImageUrl(entry: BiradsPathologyEntry): string {
  if (entry.realExampleImage) return entry.realExampleImage;
  return `/images/breast/${entry.imageFile}`;
}

export function hasRealExample(entry: BiradsPathologyEntry): boolean {
  return Boolean(entry.realExampleImage);
}

export function atlasPathologies(): BiradsPathologyEntry[] {
  return BIRADS_PATHOLOGY_LIBRARY;
}

export const BIRADS_ATLAS_INTRO =
  "Визуальный атлас типичных находок МЖ на УЗИ. Реальные эхограммы отмечены зелёным бейджем «Реальная эхограмма» — остальные иллюстрации схематичны.";
