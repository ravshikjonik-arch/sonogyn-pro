import atlasRu from "../data/atlas.ru.json";
import type { UsScanPlanesChapter, UsScanPlanesDocument } from "./types";

export type {
  UsScanPlanesChapter,
  UsScanPlanesDocument,
  UsScanPlanesImage,
} from "./types";

export const US_SCAN_PLANES_ATLAS_RU = atlasRu as UsScanPlanesDocument;

export function getUsScanPlanesAtlas(): UsScanPlanesDocument {
  return US_SCAN_PLANES_ATLAS_RU;
}

export function listUsScanPlanesChapters(sectionId?: string): UsScanPlanesChapter[] {
  const all = US_SCAN_PLANES_ATLAS_RU.chapters;
  if (!sectionId || sectionId === "all") return all;
  return all.filter((c) => c.section === sectionId);
}

export function getUsScanPlanesChapter(slug: string): UsScanPlanesChapter | undefined {
  return US_SCAN_PLANES_ATLAS_RU.chapters.find((c) => c.slug === slug);
}