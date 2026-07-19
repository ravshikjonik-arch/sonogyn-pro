export type ExamChecklistCategory = "visualize" | "measure" | "document" | "mustNotMiss";

export type ExamChecklistItemId = string;

export type ExamChecklistItem = {
  id: ExamChecklistItemId;
  category: ExamChecklistCategory;
  label: string;
  required: boolean;
  hint?: string;
};

export type ExamProtocolId =
  | "gynecologic-pelvic"
  | "obstetric-standard"
  | "obstetric-first-trimester"
  | "obstetric-third-trimester";

export type ExamProtocol = {
  id: ExamProtocolId;
  titleRu: string;
  subtitle: string;
  source: string;
  sourceUrl?: string;
  relatedHref?: string;
  relatedLabel?: string;
  items: ExamChecklistItem[];
};

export type ExamChecklistCategoryMeta = {
  id: ExamChecklistCategory;
  labelRu: string;
  description: string;
};
