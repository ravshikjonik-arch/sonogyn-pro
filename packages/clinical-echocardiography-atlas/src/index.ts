import atlasRu from "../data/atlas.ru.json";
import type { EchoAtlasChapter, EchoAtlasDocument } from "./types";

export type { EchoAtlasChapter, EchoAtlasDocument, EchoAtlasSection } from "./types";

export const CLINICAL_ECHO_ATLAS_RU = atlasRu as EchoAtlasDocument;

export function getClinicalEchoAtlas(): EchoAtlasDocument {
  return CLINICAL_ECHO_ATLAS_RU;
}

export function listClinicalEchoChapters(sectionId?: string): EchoAtlasChapter[] {
  const all = CLINICAL_ECHO_ATLAS_RU.chapters;
  if (!sectionId || sectionId === "all") return all;
  return all.filter((c) => c.section === sectionId);
}

export function getClinicalEchoChapter(slug: string): EchoAtlasChapter | undefined {
  return CLINICAL_ECHO_ATLAS_RU.chapters.find((c) => c.slug === slug);
}
