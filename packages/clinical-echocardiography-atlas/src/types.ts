export type EchoAtlasSection = {
  headingRu: string;
  bodyMarkdownRu: string;
};

export type EchoAtlasChapter = {
  slug: string;
  chapterNum: number;
  titleRu: string;
  titleEn: string;
  section: string;
  sectionRu: string;
  printStart: number;
  printEnd: number;
  summaryRu: string[];
  sections: EchoAtlasSection[];
  hasTranslation: boolean;
};

export type EchoAtlasDocument = {
  meta: {
    bookId: string;
    titleRu: string;
    sourceEn: string;
    disclaimerRu: string;
    chapterCount: number;
    translatedChapterCount: number;
    glossaryHref: string;
  };
  sections: { id: string; titleRu: string }[];
  chapters: EchoAtlasChapter[];
};
