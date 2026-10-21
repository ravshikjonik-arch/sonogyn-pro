import atlasRu from "../data/atlas.ru.json";
import type { ObAtlasChapter, ObAtlasDocument } from "./types";

export type {
  ObAtlasChapter,
  ObAtlasDifferential,
  ObAtlasDocument,
  ObAtlasImage,
} from "./types";

export const OB_IMAGING_ATLAS_RU = atlasRu as ObAtlasDocument;

export function getObImagingAtlas(): ObAtlasDocument {
  return OB_IMAGING_ATLAS_RU;
}

export function listObAtlasChapters(sectionId?: string): ObAtlasChapter[] {
  const all = OB_IMAGING_ATLAS_RU.chapters;
  if (!sectionId || sectionId === "all") return all;
  return all.filter((c) => c.section === sectionId);
}

export function getObAtlasChapter(slug: string): ObAtlasChapter | undefined {
  return OB_IMAGING_ATLAS_RU.chapters.find((c) => c.slug === slug);
}
