import referatRu from "./referat.ru.json";
import type { OradsReferatDocument } from "./types";

export type { OradsReferatCase, OradsReferatCategoryRow, OradsReferatDocument, OradsReferatSection } from "./types";

export { getOradsReferat, ORADS_REFERAT_LOCALES, type OradsReferatLocale } from "./locale";
export {
  getReferatCaseIdForImageRef,
  getReferatImagePath,
  ORADS_REFERAT_CAPTION_BY_REF,
  ORADS_REFERAT_IMAGE_BY_REF,
  ORADS_REFERAT_PUBLIC_IMAGE_BASE,
} from "./referatImageMap";
export { getReferatSectionIdForWizardNode, referatGuideHref } from "./wizardSectionMap";
export {
  getOradsNosologyById,
  getOradsNosologyBySubtype,
  isOradsNosologyPending,
  ORADS_NOSOLOGY_ATLAS,
  ORADS_NOSOLOGY_PENDING_SUBTYPES,
  ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE,
  resolveOradsNosologyImageUri,
  type OradsNosologyAtlasEntry,
  type OradsNosologySubtype,
} from "./nosologyAtlas";

export const ORADS_REFERAT_RU = referatRu as OradsReferatDocument;
