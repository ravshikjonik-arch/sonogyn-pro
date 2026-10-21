import atlasRu from "../data/atlas.ru.json";
import type { GynAtlasChapter, GynAtlasDocument } from "./types";

export type { GynAtlasChapter, GynAtlasDifferential, GynAtlasDocument, GynAtlasImage } from "./types";

export const GYN_IMAGING_ATLAS_RU = atlasRu as GynAtlasDocument;

export function getGynImagingAtlas(): GynAtlasDocument {
  return GYN_IMAGING_ATLAS_RU;
}

export function listGynAtlasChapters(sectionId?: string): GynAtlasChapter[] {
  const all = GYN_IMAGING_ATLAS_RU.chapters;
  if (!sectionId) return all;
  return all.filter((c) => c.section === sectionId);
}

export function getGynAtlasChapter(slug: string): GynAtlasChapter | undefined {
  return GYN_IMAGING_ATLAS_RU.chapters.find((c) => c.slug === slug);
}
