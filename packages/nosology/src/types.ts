/** Анатомическая зона для группировки в списке */
export type NosologyZone =
  | "uterus"
  | "endometrium"
  | "ovaries"
  | "tubes"
  | "cervix"
  | "obstetrics"
  | "other";

export const NOSOLOGY_ZONE_LABELS: Record<NosologyZone, string> = {
  uterus: "Матка",
  endometrium: "Эндометрий / полость",
  ovaries: "Яичники",
  tubes: "Маточные трубы",
  cervix: "Шейка матки",
  obstetrics: "Акушерство / плод",
  other: "Прочее",
};

export type NosologyBlock = {
  intro?: string;
  bullets?: string[];
  checklist?: string[];
  highlights?: { title: string; body: string }[];
  table?: { headers: string[]; rows: string[][] };
};

/** Статья PubMed, привязанная к нозологии (tier 2 — дополнение к КР). */
export type NosologyLiteratureItem = {
  pmid: string;
  title?: string;
  journal?: string;
  year?: number;
  /** Зачем врачу УЗИ — наша формулировка. */
  clinicalPearl?: string;
  tier?: 1 | 2 | 3;
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
  /** Готовый запрос для PubMed (англ.); иначе собирается из title/keywords. */
  pubmedQuery?: string;
  /** Дополнительная литература (PMID), поверх курируемого сида. */
  literature?: NosologyLiteratureItem[];
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
