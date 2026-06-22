import { FETAL_ANATOMY_IMAGE_BASE } from "./constants";
import { FETAL_ANATOMY_VIEWS } from "./views";
import type { FetalAnatomyViewId } from "./types";

export type FetalAnatomyAtlasEntry = {
  viewId: FetalAnatomyViewId;
  number: string | number;
  titleRu: string;
  normalSrc: string;
  pathologySrc: string;
};

/** PNG — основной формат; положите `{viewId}_{kind}.png` в public/images/fetal-anatomy. */
export function fetalAnatomyAtlasSrc(viewId: string, kind: "normal" | "pathology"): string {
  return `${FETAL_ANATOMY_IMAGE_BASE}/${viewId}_${kind}.png`;
}

export function fetalAnatomyAtlasFallbackSrc(viewId: string, kind: "normal" | "pathology"): string {
  return `${FETAL_ANATOMY_IMAGE_BASE}/${viewId}_${kind}.svg`;
}

export const FETAL_ANATOMY_ATLAS: FetalAnatomyAtlasEntry[] = FETAL_ANATOMY_VIEWS.map((v) => ({
  viewId: v.id,
  number: v.number,
  titleRu: v.titleRu,
  normalSrc: fetalAnatomyAtlasSrc(v.id, "normal"),
  pathologySrc: fetalAnatomyAtlasSrc(v.id, "pathology"),
}));
