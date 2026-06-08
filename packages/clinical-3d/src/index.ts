// ─── Типы ───────────────────────────────────────────────────────────────────
export * from "./types";

// ─── Матка (FIGO) ───────────────────────────────────────────────────────────
export * from "./organs/uterus/figoClassification";
export {
  buildUterusCoronalProtocolBlock,
  centroidOfStroke as uterusCentroidOfStroke,
  detectOrganZone,
  formatUterusCoronalMarkerRu,
  strokeToSvgPath as uterusStrokeToSvgPath,
  UTERUS_CORONAL_ANATOMY_SRC,
  type UterusCoronalMarker,
  type UterusLesionKind,
  type UterusNormPoint,
  type UterusOrganZone,
} from "./organs/uterus/uterusCoronalTopography";
export { UterusModel } from "./organs/uterus/UterusModel";
export type { UterusModelProps } from "./organs/uterus/UterusModel";

// ─── Яичники (IOTA / O-RADS) ────────────────────────────────────────────────
export * from "./organs/ovary/iotaRules";
export * from "./organs/ovary/oradsMapping";
export {
  buildOvaryProtocolBlock,
  centroidOfStroke as ovaryCentroidOfStroke,
  countMarkersByKind,
  formatOvaryMarkerRu,
  OVARY_MARKER_LABELS_RU,
  OVARY_MORPHOLOGY_LABELS_RU,
  ovaryClockSector,
  strokeToSvgPath as ovaryStrokeToSvgPath,
  type OvaryMarkerKind,
  type OvaryMorphologyPreset,
  type OvaryNormPoint,
  type OvarySide,
  type OvaryTopographyMarker,
} from "./organs/ovary/ovaryTopography";
export { OvaryModel } from "./organs/ovary/OvaryModel";
export type { OvaryModelProps } from "./organs/ovary/OvaryModel";

// ─── Молочная железа (BI-RADS) ──────────────────────────────────────────────
export * from "./organs/breast/biradsMapping";
export {
  breastClockHour,
  buildBreastProtocolBlock,
  centroidOfStroke,
  formatBreastLocationRu,
  formatBreastLocationShort,
  getBreastLocation,
  strokeToSvgPath,
  type BreastLocationResult,
  type BreastNormPoint,
  type BreastSide,
  type BreastTopographyMarker,
} from "./organs/breast/breastTopography";
export { BreastModel, createBreastGeometry } from "./organs/breast/BreastModel";
export type { BreastModelProps } from "./organs/breast/BreastModel";

// ─── Беременность (FMF) ─────────────────────────────────────────────────────
export * from "./organs/pregnancy/fmfReferenceData";
export { FetusModel } from "./organs/pregnancy/FetusModel";
export type { FetusModelProps } from "./organs/pregnancy/FetusModel";

// ─── Прочие органы (заготовки) ────────────────────────────────────────────
export { CervixModel } from "./organs/cervix/CervixModel";
export type { CervixModelProps } from "./organs/cervix/CervixModel";
export { TubeModel } from "./organs/adnexa/TubeModel";
export type { TubeModelProps } from "./organs/adnexa/TubeModel";

// ─── Хуки и локализация ─────────────────────────────────────────────────────
export { useOrganInteraction } from "./hooks/useOrganInteraction";
export { useClinicalAnnotation } from "./hooks/useClinicalAnnotation";
export { useMeasurement } from "./hooks/useMeasurement";
export {
  CLINICAL_3D_LOCALES,
  DEFAULT_CLINICAL_3D_LOCALE,
  type Clinical3dLocale,
} from "./shared/locale";
