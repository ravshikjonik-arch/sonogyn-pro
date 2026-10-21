export type GynAtlasImage = {
  file: string;
  href: string;
  captionRu: string;
  modality: string;
  printPage?: string;
};

export type GynAtlasDifferential = {
  diagnosisRu: string;
  pointsRu: string[];
};

export type GynAtlasChapter = {
  slug: string;
  titleRu: string;
  titleEn: string;
  section: string;
  sectionRu: string;
  printStart: number;
  printEnd: number;
  keyFactsRu: string[];
  differentialRu: GynAtlasDifferential[];
  images: GynAtlasImage[];
};

export type GynAtlasDocument = {
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
  chapters: GynAtlasChapter[];
};
