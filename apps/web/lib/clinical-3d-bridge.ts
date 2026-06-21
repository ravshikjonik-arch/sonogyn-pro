/**
 * Мост миграции: матка пока в @clinical/uterus, новые органы — в @repo/clinical-3d.
 * Импортируйте отсюда, не ломая legacy-пути.
 */
export {
  ProceduralUterus,
  type ProceduralUterusProps,
  computeFibroidClinicalMetrics,
  type FibroidClinicalMetrics,
} from "@clinical/uterus";

export {
  BreastModel,
  FIGO_TYPES,
  getFigoColor,
  getEndometrialCavityStatus,
  FIGO_ATLAS_ENTRIES,
  formatFigoProtocolLine,
  formatFigoSonoGynBlock,
  getFigoAtlasEntryForType,
  type FigoDisplayCode,
  type FigoVariantCode,
  applyIotaSimpleRules,
  getPercentile,
  CLINICAL_3D_LOCALES,
  type FigoType,
  type BreastLesionAnnotation,
} from "@repo/clinical-3d";
