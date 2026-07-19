import { findAdnexPageByTopic, getAdnexPage } from "@repo/adnex-education";
import {
  getReferatImagePath,
  ORADS_ATLAS_PAGE_FALLBACK,
  ORADS_ATLAS_TOPIC_BY_REF,
  ORADS_REFERAT_CAPTION_BY_REF,
} from "@repo/orads-us";

export type OradsAtlasPreview = {
  src: string;
  title: string | null;
  teachingHint: string | null;
  pageId: string;
  source: "referat" | "adnex";
};

/** Resolve wizard `imageRef` → public path for Ozerskaya atlas or referat echograms. */
export function resolveOradsAtlasPreview(imageRef?: string): OradsAtlasPreview | null {
  if (!imageRef) return null;

  const referatPath = getReferatImagePath(imageRef);
  if (referatPath) {
    const caption = ORADS_REFERAT_CAPTION_BY_REF[imageRef] ?? null;
    return {
      src: referatPath,
      title: caption,
      teachingHint: caption,
      pageId: `referat:${imageRef}`,
      source: "referat",
    };
  }

  const topic = ORADS_ATLAS_TOPIC_BY_REF[imageRef];
  const fallbackId = ORADS_ATLAS_PAGE_FALLBACK[imageRef];
  const page =
    (topic ? findAdnexPageByTopic(topic) : undefined) ??
    (fallbackId ? getAdnexPage(fallbackId) : undefined) ??
    getAdnexPage("ozerskaya-p06");

  if (!page?.image_href) return null;

  return {
    src: page.image_href,
    title: page.title ?? null,
    teachingHint: page.teaching_hint ?? null,
    pageId: page.id,
    source: "adnex",
  };
}
