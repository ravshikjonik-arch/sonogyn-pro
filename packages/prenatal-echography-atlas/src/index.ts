import atlasRu from "../data/atlas.ru.json";
import type { PrenatalEchoChapter, PrenatalEchoDocument } from "./types";

export type { PrenatalEchoChapter, PrenatalEchoDocument, PrenatalEchoImage } from "./types";

export const PRENATAL_ECHO_ATLAS_RU = atlasRu as PrenatalEchoDocument;

export function getPrenatalEchoAtlas(): PrenatalEchoDocument {
  return PRENATAL_ECHO_ATLAS_RU;
}

export function listPrenatalEchoChapters(sectionId?: string): PrenatalEchoChapter[] {
  const all = PRENATAL_ECHO_ATLAS_RU.chapters;
  if (!sectionId || sectionId === "all") return all;
  return all.filter((c) => c.section === sectionId);
}

export function getPrenatalEchoChapter(slug: string): PrenatalEchoChapter | undefined {
  return PRENATAL_ECHO_ATLAS_RU.chapters.find((c) => c.slug === slug);
}
