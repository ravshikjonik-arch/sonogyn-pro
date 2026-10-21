import atlasRu from "../data/atlas.ru.json";
import type { MammologyAtlasChapter, MammologyAtlasDocument } from "./types";

export type { MammologyAtlasChapter, MammologyAtlasDocument, MammologyAtlasImage } from "./types";

export const MAMMOLOGY_NATIONAL_ATLAS_RU = atlasRu as MammologyAtlasDocument;

export function getMammologyNationalAtlas(): MammologyAtlasDocument {
  return MAMMOLOGY_NATIONAL_ATLAS_RU;
}

export function listMammologyAtlasChapters(sectionId?: string): MammologyAtlasChapter[] {
  const all = MAMMOLOGY_NATIONAL_ATLAS_RU.chapters;
  if (!sectionId || sectionId === "all") return all;
  return all.filter((c) => c.section === sectionId);
}

export function getMammologyAtlasChapter(slug: string): MammologyAtlasChapter | undefined {
  return MAMMOLOGY_NATIONAL_ATLAS_RU.chapters.find((c) => c.slug === slug);
}
