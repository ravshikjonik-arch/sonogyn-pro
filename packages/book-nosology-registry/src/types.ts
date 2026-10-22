/** Зоны как в @repo/nosology (без runtime-зависимости). */
export type BookNosologyZone =
  | "uterus"
  | "endometrium"
  | "ovaries"
  | "tubes"
  | "cervix"
  | "obstetrics"
  | "breast"
  | "other";

export type BookNosologyModality =
  | "histology"
  | "us"
  | "mammography"
  | "echocardiography"
  | "text";

export type BookNosologyKind = "clinical" | "reference";

export type BookNosologyEntry = {
  id: string;
  bookId: string;
  chapterSlug: string;
  titleRu: string;
  zone: BookNosologyZone;
  domainLabel: string;
  modality: BookNosologyModality;
  kind: BookNosologyKind;
  imageCount: number;
  summaryRu: string;
  keyFactsRu: string[];
  atlasHref: string;
  previewImageHref?: string;
  linkedSeedNosologyIds: string[];
  printStart?: number;
  printEnd?: number;
  hasTranslation?: boolean;
  /** Порок/находка из CSV пренатала */
  parentChapterSlug?: string;
  findingSlug?: string;
  imageHrefs?: string[];
};

export type BookNosologyRegistry = {
  version: number;
  generatedAt: string;
  entryCount: number;
  clinicalCount: number;
  /** Пренатальные пороки/находки (отдельные строки в generated registry). */
  prenatalFindingCount?: number;
  entries: BookNosologyEntry[];
};

export const BOOK_NOSOLOGY_ZONE_LABELS: Record<BookNosologyZone, string> = {
  uterus: "Матка",
  endometrium: "Эндометрий / полость",
  ovaries: "Яичники",
  tubes: "Маточные трубы",
  cervix: "Шейка матки",
  obstetrics: "Акушерство / плод",
  breast: "Молочная железа",
  other: "Прочее (МЖ, сердце, …)",
};

export const BOOK_ID_LABELS: Record<string, string> = {
  "cervix-morpho": "Опухоли шейки · морфология",
  "kaprin-mammology": "Маммология · Каприн",
  "prenatal-echo": "Пренатальная эхография",
  "otto-echo": "Otto · эхокардиография",
  "prenatal-finding": "Пренатал · пороки по снимкам",
};
