export type AdnexChapterId = "intro" | "iota" | "morphology" | "orads" | "management" | "conclusion" | string;

export type AdnexPageRecord = {
  id: string;
  page_number: number;
  image_href: string;
  chapter: AdnexChapterId;
  topics: string[];
  title: string | null;
  ocr_text: string;
  teaching_hint: string | null;
  figure_refs: string[];
  quality: string;
};

export type AdnexDataset = {
  source: Record<string, unknown>;
  chapters: { id: string; title: string }[];
  pages: AdnexPageRecord[];
};

export type IotaSimpleCode = `B${1 | 2 | 3 | 4 | 5 | 6}` | `M${1 | 2 | 3 | 4 | 5}`;

export type IotaSimpleVerdict = "benign" | "malignant" | "indeterminate";

export type IotaSimpleRulesResult = {
  verdict: IotaSimpleVerdict;
  benignMatched: IotaSimpleCode[];
  malignantMatched: IotaSimpleCode[];
  summaryRu: string;
  /** Подсказка к доп. литературе, не к основному протоколу. */
  supplementaryNote?: string;
  /** @deprecated используйте supplementaryNote */
  ozerskayaNote?: string;
};
