export type CervixMorphAtlasImage = {
  file: string;
  href: string;
  captionRu: string;
  modality: string;
  printPage?: string;
};

export type CervixMorphAtlasDifferential = {
  diagnosisRu: string;
  pointsRu: string[];
};

export type CervixMorphAtlasChapter = {
  slug: string;
  titleRu: string;
  titleEn: string;
  section: string;
  sectionRu: string;
  printStart: number;
  printEnd: number;
  keyFactsRu: string[];
  differentialRu: CervixMorphAtlasDifferential[];
  images: CervixMorphAtlasImage[];
};

export type CervixMorphAtlasDocument = {
  meta: {
    bookId: string;
    titleRu: string;
    sourceEn: string;
    disclaimerRu: string;
    imageBase: string;
    chapterCount: number;
    usImageCount: number;
  };
  sections: { id: string; titleRu: string }[];
  chapters: CervixMorphAtlasChapter[];
};
