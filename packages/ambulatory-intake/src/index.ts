export {
  AMBULATORY_INTAKE_DISCLAIMER,
  AMBULATORY_INTAKE_SECTIONS,
  CHART_FIELD_IDS,
  CHART_FIELD_LABELS,
  REGULATORY_CHECK_LINKS,
  getItemLabel,
  listAllItems,
  type ChartFieldId,
} from "./catalog";

export {
  AmbulatoryIntakeDraftSchema,
  ChecklistItemSchema,
  ChecklistSectionSchema,
  ItemStatusSchema,
  ItemStateSchema,
  VisitViewSchema,
  createDraftForReasons,
  createEmptyDraft,
  emptyItemState,
  type AmbulatoryIntakeDraft,
  type ChecklistItem,
  type ChecklistSection,
  type ChecklistSubsection,
  type ItemState,
  type ItemStatus,
  type VisitView,
} from "./schemas";

export { buildChartNoteDraft, buildChartNoteDraftV1, countMarkedItems } from "./note-builder";

export {
  DEFAULT_REGION,
  REGION_PROFILES,
  RegionCodeSchema,
  getRegionProfile,
  type RegionCode,
  type RegionProfile,
} from "./regions";

export {
  REGULATORY_DOCUMENTS,
  REGULATORY_STATUS_LABELS,
  listRegulatoryForRegion,
  searchRegulatoryNaturalLanguage,
  type RegulatoryDocKind,
  type RegulatoryDocument,
  type RegulatoryVerifyStatus,
} from "./regulatory";

export { VISIT_REASONS, getReason, type VisitReason, type VisitReasonId } from "./reasons";

export {
  CLINICAL_SCENARIOS,
  getScenario,
  scenariosForReasons,
  type ClinicalScenario,
  type ScenarioToolLink,
} from "./scenarios";

export { LAB_ITEMS, labsForReasons, type LabItem, type LabTier } from "./labs";

export {
  buildDynamicChecklist,
  getPinnedEssentials,
  filterImportant,
  type DynamicItem,
  type DynamicSection,
} from "./checklist-dynamic";

export const AMBULATORY_INTAKE_STORAGE_KEY = "sonogyn:ambulatory-intake:draft:v2";
export const AMBULATORY_INTAKE_ROUTE = "/tools/refs/ambulatory-intake";
/** Product name in UI */
export const AMBULATORY_PRODUCT_TITLE = "ЧЕК-ЛИСТ АМБУЛАТОРИИ";
export const AMBULATORY_PRODUCT_SUBTITLE = "Интерактивный чек-лист акушера-гинеколога";
