export {
  CLINIC_ACCREDITATION_MODULE_ID,
  CLINIC_ACCREDITATION_MODULE_TITLE_RU,
  CLINIC_ACCREDITATION_DISCLAIMER,
  CLINIC_ACCREDITATION_LINKS,
  ACCREDITATION_CATEGORY_LABELS,
} from "./constants";

export {
  ACCREDITATION_SECTIONS,
  ACCREDITATION_ITEM_COUNT,
  sectionCompleteness,
  itemsByCategory,
} from "./checklists";

export { loadSectionProgress, setAccreditationItemDone, resetSectionProgress } from "./progress";

export type { AccreditationCategory, AccreditationChecklistItem, AccreditationSection } from "./checklists";
