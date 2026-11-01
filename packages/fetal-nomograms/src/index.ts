export {
  NOMOGRAM_DATASET,
  NOMOGRAM_DISCLAIMER,
  NOMOGRAM_CATEGORY_LABELS,
  getNomogramById,
  listNomogramCategories,
  listNomogramsByCategory,
  listAllNomograms,
  getScoringSystem,
  listClinicalDefinitions,
} from "./dataset";

export { evaluateNomogram, gaStringToTotalDays } from "./evaluateNomogram";

export { buildNomogramChartSeries, type NomogramChartSeries, type NomogramChartPoint } from "./chartSeries";

export {
  NOMOGRAM_DECISION_TREE,
  NOMOGRAM_WIZARD_START,
  nextInputStepForNomogram,
  buildDecisionTreePath,
  type NomogramDecisionNode,
  type NomogramDecisionNodeId,
  type NomogramDecisionOption,
} from "./nomogramDecisionTree";

export { evaluateTrisomyScore, type TrisomyScoreResult } from "./trisomyScore";

export type {
  Nomogram,
  NomogramCategory,
  NomogramDataset,
  EvaluateNomogramInput,
  EvaluateNomogramResult,
} from "./types";

export {
  listMedvedevBookTables,
  getMedvedevBookTable,
  listTablesBySection,
  lookupRow,
  classifyValue,
  evaluateMeasurement,
  evaluateFetometryPanel,
  estimateGaFromSvd,
  resolveBaseBiometryTableId,
  T1_PANEL_FIELDS,
  T2_BASE_FIELDS,
  EXTENDED_FIELDS,
  HEART_FIELDS,
  DOPPLER_FIELDS,
  POPULATION_OPTIONS,
  fieldsForSection,
  remapMeasurementIdsForPopulation,
  MEDVEDEV_BOOK_WARNINGS,
  MEDVEDEV_BOOK_DISCLAIMER,
  MEDVEDEV_BOOK_SOURCE_VERSION,
  parseGaSlashToDays,
  parseGaSlashParts,
  formatGaDays,
  parseInclusiveRange,
} from "./medvedevBook";

export type {
  FetometryTable,
  FetometryRow,
  FetometrySection,
  FetometryPopulation,
  EvaluateContext,
  MeasurementResult,
  PanelResult,
  ZoneFlag,
  PanelField,
} from "./medvedevBook";
