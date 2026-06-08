/** Анатомическая зона для группировки в списке */
export type NosologyZone =
  | "uterus"
  | "endometrium"
  | "ovaries"
  | "tubes"
  | "cervix"
  | "other";

export const NOSOLOGY_ZONE_LABELS: Record<NosologyZone, string> = {
  uterus: "Матка",
  endometrium: "Эндометрий / полость",
  ovaries: "Яичники",
  tubes: "Маточные трубы",
  cervix: "Шейка матки",
  other: "Прочее",
};

export type NosologyBlock = {
  intro?: string;
  bullets?: string[];
  checklist?: string[];
  highlights?: { title: string; body: string }[];
  table?: { headers: string[]; rows: string[][] };
};

export type Nosology = {
  id: string;
  title: string;
  zone: NosologyZone;
  icd10?: string;
  keywords: string[];
  description: string;
  examinationScheme: NosologyBlock;
  diagnostics: NosologyBlock;
  treatment: NosologyBlock;
  guidelines: NosologyBlock;
  /** Строка для поля «Диагноз» в протоколе */
  diagnosisLine: string;
  /** Шаблон заключения; плейсхолдеры: {размер}, {локализация}, {степень} */
  protocolTemplate: string;
  /** Ключевые слова для будущего поиска по PDF-книге */
  pdfKeywords?: string[];
  /** Подсказка страницы PDF (заглушка до подключения книги) */
  pdfPageHint?: number;
  updatedAt?: string;
};

export type NosologySearchHit = {
  id: string;
  title: string;
  zone: NosologyZone;
  snippet: string;
  score: number;
};

export type AdminAction = "create" | "update" | "delete" | "import" | "export";

export type NosologyStoreMeta = {
  seedVersion: string;
  lastImportAt?: string;
};
