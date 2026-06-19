export type {
  AtlasCatalogPart,
  AtlasDataset,
  AtlasMeasurementRule,
  AtlasPageRecord,
  AtlasPartId,
  EarlyPregnancyCheckInput,
  RuleCheckResult,
} from "./types";

export {
  BLINOV_EARLY_THRESHOLDS,
  earlyPregnancyPrognosis,
  evaluateEarlyPregnancyRules,
} from "./rules/early-pregnancy";

export {
  getAtlasDataset,
  getAtlasPage,
  listAtlasPages,
  searchAtlasPages,
} from "./loader";

export const ATLAS_SOURCE_CITATION =
  "Блинов А.Ю., Емельяненко Е.С. Атлас по УЗ-диагностике в акушерстве. М.: МЕДпресс-информ, 2024.";
