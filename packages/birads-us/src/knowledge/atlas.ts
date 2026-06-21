import { BIRADS_CATEGORIES, type BiradsCategoryCode } from "./categories";
import { BIRADS_PATHOLOGY_LIBRARY, type BiradsPathologyEntry } from "./differential";

export type BiradsAtlasCategoryTab = BiradsCategoryCode;

export function atlasCategoryTabs(): typeof BIRADS_CATEGORIES {
  return BIRADS_CATEGORIES;
}

export function pathologyImageUrl(entry: BiradsPathologyEntry): string {
  return `/images/breast/${entry.imageFile}`;
}

export function atlasPathologies(): BiradsPathologyEntry[] {
  return BIRADS_PATHOLOGY_LIBRARY;
}

export const BIRADS_ATLAS_INTRO =
  "Визуальный атлас типичных находок МЖ на УЗИ. Изображения — схематичные заглушки для интеграции реальных эхограмм центра.";
