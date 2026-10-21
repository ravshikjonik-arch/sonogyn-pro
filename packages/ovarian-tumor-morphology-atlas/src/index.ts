import atlasRu from "../data/atlas.ru.json";
import type { OvarianMorphAtlasChapter, OvarianMorphAtlasDocument } from "./types";

export type {
  OvarianMorphAtlasChapter,
  OvarianMorphAtlasDocument,
  OvarianMorphAtlasImage,
} from "./types";

export const OVARIAN_TUMOR_MORPH_ATLAS_RU = atlasRu as OvarianMorphAtlasDocument;

export function getOvarianTumorMorphAtlas(): OvarianMorphAtlasDocument {
  return OVARIAN_TUMOR_MORPH_ATLAS_RU;
}

export function listOvarianTumorMorphChapters(sectionId?: string): OvarianMorphAtlasChapter[] {
  const all = OVARIAN_TUMOR_MORPH_ATLAS_RU.chapters;
  if (!sectionId || sectionId === "all") return all;
  return all.filter((c) => c.section === sectionId);
}

export function getOvarianTumorMorphChapter(slug: string): OvarianMorphAtlasChapter | undefined {
  return OVARIAN_TUMOR_MORPH_ATLAS_RU.chapters.find((c) => c.slug === slug);
}
