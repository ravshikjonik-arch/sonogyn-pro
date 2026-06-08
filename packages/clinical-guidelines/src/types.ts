/** Полка каталога — отдельный раздел виджета */
export type GuidelineShelf =
  | "kr_mz_rf"
  | "orders_dzm"
  | "orders_mz_rf"
  | "protocols_org"
  | "international";

export type GuidelineDocumentKind = "clinical_recommendation" | "order" | "protocol" | "standard";

export type GuidelineStatus = "active" | "superseded" | "draft";

/** Издатель / уровень документа */
export type GuidelineIssuer =
  | "mz_rf"
  | "dzm"
  | "roag"
  | "rosonm"
  | "isuo"
  | "eshre"
  | "who"
  | "other";

/** Специальность / зона практики */
export type GuidelineSpecialty =
  | "obgyn"
  | "obstetrics"
  | "ultrasound"
  | "mammology"
  | "prenatal"
  | "general";

export type GuidelineSection = {
  title: string;
  bullets: string[];
};

export type ClinicalGuideline = {
  id: string;
  title: string;
  summary: string;
  shelf: GuidelineShelf;
  documentKind: GuidelineDocumentKind;
  issuer: GuidelineIssuer;
  specialty: GuidelineSpecialty;
  year: number;
  status: GuidelineStatus;
  /** Официальная ссылка (cr.minzdrav.gov.ru, mos.ru и т.д.) */
  officialUrl?: string;
  /** Номер приказа / протокола */
  documentNumber?: string;
  /** Дата вступления в силу (ISO или DD.MM.YYYY) */
  effectiveFrom?: string;
  sections?: GuidelineSection[];
  tags?: string[];
  revisedAt?: string;
  /** Связь с `@repo/nosology` */
  relatedNosologyIds?: string[];
};

export type GuidelineSpecialtyFilter = GuidelineSpecialty | "all";
export type GuidelineShelfFilter = GuidelineShelf | "all";

export type GuidelineSearchHit = {
  id: string;
  title: string;
  shelf: GuidelineShelf;
  specialty: GuidelineSpecialty;
  snippet: string;
  score: number;
};
