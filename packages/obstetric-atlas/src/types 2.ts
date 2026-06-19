export type AtlasPartId = "intro" | "early" | "anatomy_11_14" | "appendix" | "conclusion" | "general";

export type AtlasMeasurementRule = {
  id: string;
  field: string;
  op: "between" | "gte" | "lte" | "eq";
  min?: number;
  max?: number;
  value?: boolean | number | string;
  label: string;
  fail_message: string;
};

export type AtlasPageRecord = {
  id: string;
  page_number: number;
  book_page_label: number | null;
  image_href: string;
  part: AtlasPartId | string;
  topics: string[];
  ga_weeks_min: number | null;
  ga_weeks_max: number | null;
  measurements_mm: number[];
  title: string | null;
  section: string | null;
  ocr_text: string;
  rules: AtlasMeasurementRule[];
  teaching_hint: string | null;
  quality: "draft" | "ocr" | "image_only" | "reviewed";
};

export type AtlasCatalogPart = {
  id: AtlasPartId | string;
  title: string;
  ga_weeks: { min: number; max: number } | null;
};

export type AtlasDataset = {
  catalog: {
    source: Record<string, unknown>;
    parts: AtlasCatalogPart[];
    page_count: number;
    generated_by: string;
  };
  pages: AtlasPageRecord[];
  rules_index: AtlasMeasurementRule[];
};

export type EarlyPregnancyCheckInput = {
  gest_sac_ring_mm?: number;
  yolk_sac_diameter_mm?: number;
  yolk_sac_count?: number;
  embryo_count?: number;
  yolk_sac_echogenicity?: "anechoic" | "echogenic" | "unknown";
  yolk_sac_shape?: "round" | "irregular" | "unknown";
};

export type RuleCheckResult = {
  id: string;
  label: string;
  ok: boolean;
  message: string;
};
