/** Book SSOT: «Ультразвуковая дифференциальная диагностика новообразований яичников». */

export type OradsBookColorScoreScale = Record<string, string>;

export type OradsBookLexiconItem = {
  term: string;
  definition: string;
  comment?: string;
};

export type OradsBookLexiconGroup = {
  group: string;
  items: OradsBookLexiconItem[];
};

export type OradsBookLexiconDocument = {
  source: string;
  description: string;
  notes?: string[];
  color_score_scale: OradsBookColorScoreScale;
  terms: OradsBookLexiconGroup[];
};

export type OradsBookManagement =
  | string
  | {
      general?: string;
      premenopause?: string;
      postmenopause?: string;
      postmenopause_early?: string;
      postmenopause_late?: string;
      note?: string;
    }
  | null;

export type OradsBookCategoryRule = {
  finding: string;
  management?: OradsBookManagement;
};

export type OradsBookCategory = {
  orads: number | string;
  name?: string;
  risk?: string | null;
  description?: string;
  note?: string;
  rules?: OradsBookCategoryRule[];
  management?: OradsBookManagement;
};

export type OradsBookTypicalBenign = {
  name: string;
  descriptors: string;
  management: OradsBookManagement;
};

export type OradsBookAdnexModel = {
  name: string;
  description: string;
  clinical_params: string[];
  ultrasound_params: string[];
  note: string;
  orads_mapping: Record<string, string>;
};

export type OradsBookCategoriesDocument = {
  source: string;
  description: string;
  notes?: string[];
  categories: OradsBookCategory[];
  footnotes?: Record<string, string>;
  typical_benign: OradsBookTypicalBenign[];
  adnex_model: OradsBookAdnexModel;
  orads_2022_principles: string[];
};

export type OradsBookTumorCard = {
  id: string;
  name: string;
  group: string;
  age: string;
  laterality: string;
  appearance: string;
  typical_features: string;
  color_score: string;
};

export type OradsBookTumorCardsDocument = {
  source: string;
  description: string;
  fields: Record<string, string>;
  tumors: OradsBookTumorCard[];
};

export type OradsBookPhotocard = {
  file: string;
  book: number;
  page: number;
  tags: string[];
  titleRu: string;
  relatedTumorIds?: string[];
};

export type OradsBookPhotocardsManifest = {
  source: string;
  publicBase: string;
  disclaimerRu: string;
  cards: OradsBookPhotocard[];
};
