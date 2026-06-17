export type OradsReferatCase = {
  id: string;
  number: number;
  title: string;
  caption: string;
  /** Public web path; empty if no figure in source document */
  image: string;
  sectionId: string;
  wizardNodeIds?: string[];
};

export type OradsReferatCategoryRow = {
  category: string;
  risk: string;
  description: string;
  management: string;
};

export type OradsReferatSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  image?: string;
  imageCaption?: string;
  wizardNodeIds?: string[];
};

export type OradsReferatDocument = {
  meta: {
    title: string;
    subtitle: string;
    version: string;
    disclaimer: string;
    source: string;
    logoImage: string;
  };
  sections: OradsReferatSection[];
  cases: OradsReferatCase[];
  categories: OradsReferatCategoryRow[];
};
