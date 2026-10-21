import atlasRu from "../data/atlas.ru.json";
import type { CervixMorphAtlasChapter, CervixMorphAtlasDocument } from "./types";

export type {
  CervixMorphAtlasChapter,
  CervixMorphAtlasDifferential,
  CervixMorphAtlasDocument,
  CervixMorphAtlasImage,
} from "./types";

export const CERVIX_MORPH_ATLAS_RU = atlasRu as CervixMorphAtlasDocument;

export function getCervixMorphAtlas(): CervixMorphAtlasDocument {
  return CERVIX_MORPH_ATLAS_RU;
}

export function listCervixMorphChapters(sectionId?: string): CervixMorphAtlasChapter[] {
  const all = CERVIX_MORPH_ATLAS_RU.chapters;
  if (!sectionId || sectionId === "all") return all;
  return all.filter((c) => c.section === sectionId);
}

export function getCervixMorphChapter(slug: string): CervixMorphAtlasChapter | undefined {
  return CERVIX_MORPH_ATLAS_RU.chapters.find((c) => c.slug === slug);
}
