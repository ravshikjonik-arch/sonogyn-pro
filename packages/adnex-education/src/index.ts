export type {
  AdnexChapterId,
  AdnexDataset,
  AdnexPageRecord,
  IotaSimpleCode,
  IotaSimpleRulesResult,
  IotaSimpleVerdict,
} from "./types";

export type { SupplementaryReadingItem } from "./orads-protocol";

export {
  ORADS_US_VERSION,
  ORADS_US_PRIMARY_SOURCES,
  ORADS_US_SOLID_COMPONENT_MIN_MM,
  ORADS_US_MANAGEMENT,
  ORADS_US_PITFALL_BULLETS,
  ORADS_ECHOGRAMS_LIBRARY_PATH,
  SUPPLEMENTARY_READING,
  buildSupplementaryReadingBlock,
  oradsEchogramsLibraryHref,
  oradsManagementForCategory,
} from "./orads-protocol";

export {
  IOTA_BENIGN_DESCRIPTORS,
  IOTA_MALIGNANT_DESCRIPTORS,
  ORADS_US_CLINICAL_BULLETS,
  OZERSKAYA_IOTA_BULLETS,
  OZERSKAYA_ORADS_MANAGEMENT,
  OZERSKAYA_SOLID_COMPONENT_MIN_MM,
  evaluateIotaSimpleRules,
  ozerskayaManagementForOrads,
} from "./ozerskaya-iota";

export {
  findAdnexPageByTopic,
  getAdnexDataset,
  getAdnexPage,
  listAdnexPages,
  searchAdnexPages,
} from "./loader";

export type {
  AdnexCalcInput,
  AdnexTriangulation,
  AdnexTriangulationAgreement,
  OradsProtocolPitfall,
  OzerskayaGuardrail,
} from "./adnex-consensus";

export {
  buildAdnexTriangulationReport,
  deriveIotaCodesFromInput,
  evaluateAdnexTriangulation,
  evaluateOradsProtocolPitfalls,
  evaluateOzerskayaGuardrails,
} from "./adnex-consensus";

import { SUPPLEMENTARY_READING } from "./orads-protocol";

/** @deprecated используйте SUPPLEMENTARY_READING[0].citation */
export const OZERSKAYA_CITATION = SUPPLEMENTARY_READING[0]?.citation ?? "";
