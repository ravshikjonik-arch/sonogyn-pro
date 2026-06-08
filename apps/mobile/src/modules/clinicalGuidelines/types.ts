export type {
  ClinicalGuideline,
  GuidelineDocumentKind,
  GuidelineIssuer,
  GuidelineSection,
  GuidelineShelf,
  GuidelineSpecialty,
  GuidelineStatus,
} from "@repo/clinical-guidelines";

/** @deprecated используйте GuidelineSpecialtyFilter из пакета */
export type GuidelineFilter = import("@repo/clinical-guidelines").GuidelineSpecialtyFilter;
