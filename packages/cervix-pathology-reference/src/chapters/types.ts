export type CervixChapterId =
  | "01-anatomy"
  | "02-diagnostics"
  | "03-benign-conditions"
  | "04-treatment-methods"
  | "05-special-populations"
  | "06-precancerous"
  | "07-cervical-cancer";

export type CervixChapterMeta = {
  id: CervixChapterId;
  number: number;
  title: string;
  shortTitle: string;
};

export type CervixChapterContent = CervixChapterMeta & {
  studentGuide: string;
  doctorQuickref: string;
  criteria: Record<string, unknown>;
};
