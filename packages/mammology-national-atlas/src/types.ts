export type MammologyAtlasImage = {
  file: string;
  href: string;
  captionRu: string;
  modality: string;
  printPage?: string;
};

export type MammologyAtlasChapter = {
  slug: string;
  titleRu: string;
  titleEn: string;
  section: string;
  sectionRu: string;
  printStart: number;
  printEnd: number;
  keyFactsRu: string[];
  figureCaptionsRu: string[];
  differentialRu: { diagnosisRu: string; pointsRu: string[] }[];
  images: MammologyAtlasImage[];
};

export type MammologyAtlasDocument = {
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
  chapters: MammologyAtlasChapter[];
};
