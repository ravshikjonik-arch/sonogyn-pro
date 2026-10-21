export type PrenatalEchoImage = {
  file: string;
  href: string;
  captionRu: string;
  modality: string;
  printPage?: string;
};

export type PrenatalEchoChapter = {
  slug: string;
  titleRu: string;
  titleEn: string;
  section: string;
  sectionRu: string;
  printStart: number;
  printEnd: number;
  keyFactsRu: string[];
  differentialRu: { diagnosisRu: string; pointsRu: string[] }[];
  images: PrenatalEchoImage[];
};

export type PrenatalEchoDocument = {
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
  chapters: PrenatalEchoChapter[];
};
