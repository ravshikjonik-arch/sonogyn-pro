export {
  listMedvedevBookTables,
  getMedvedevBookTable,
  listTablesBySection,
} from "./loadTables";

export {
  lookupRow,
  classifyValue,
  evaluateMeasurement,
  evaluateFetometryPanel,
  estimateGaFromSvd,
  resolveBaseBiometryTableId,
} from "./evaluate";

export {
  T1_PANEL_FIELDS,
  T2_BASE_FIELDS,
  EXTENDED_FIELDS,
  HEART_FIELDS,
  DOPPLER_FIELDS,
  POPULATION_OPTIONS,
  fieldsForSection,
  fieldsWithGuidesForSection,
  groupFields,
  remapMeasurementIdsForPopulation,
  type PanelField,
  type PanelFieldWithGuide,
} from "./panelFields";

export {
  MEASUREMENT_GUIDES,
  getMeasurementGuide,
  type MeasurementGuide,
} from "./measurementGuides";

export {
  MEDVEDEV_BOOK_WARNINGS,
  MEDVEDEV_BOOK_DISCLAIMER,
  MEDVEDEV_BOOK_SOURCE_VERSION,
} from "./warnings";

export {
  parseGaSlashToDays,
  parseGaSlashParts,
  formatGaDays,
  parseInclusiveRange,
} from "./parse";

export type {
  FetometryTable,
  FetometryRow,
  FetometrySection,
  FetometryPopulation,
  EvaluateContext,
  MeasurementResult,
  PanelResult,
  ZoneFlag,
} from "./types";
