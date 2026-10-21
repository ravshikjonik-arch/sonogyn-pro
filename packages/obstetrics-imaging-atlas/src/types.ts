export type ObAtlasImage = {
  file: string;
  href: string;
  captionRu: string;
  modality: string;
  printPage?: string;
};

export type ObAtlasDifferential = {
  diagnosisRu: string;
  pointsRu: string[];
};

export type ObAtlasChapter = {
  slug: string;
  titleRu: string;
  titleEn: string;
  section: string;
  sectionRu: string;
  printStart: number;
  printEnd: number;
  keyFactsRu: string[];
  differentialRu: ObAtlasDifferential[];
  images: ObAtlasImage[];
};

export type ObAtlasDocument = {
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
  chapters: ObAtlasChapter[];
};
