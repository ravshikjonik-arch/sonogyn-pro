/** Уровень доказательности источника (упрощённая пирамида). */
export type EvidenceTier = 1 | 2 | 3;

/** Полки SonoEvidence — все 7 полок активны. */
export type EvidenceShelf =
  | "us-fmf"
  | "obgyn"
  | "cervix"
  | "mammo"
  | "onco"
  | "endocrine"
  | "surgery";

export type EvidenceSource = {
  label: string;
  organization?: string;
  year?: number;
  url?: string;
  pmid?: string;
};

export type EvidenceRelatedLink = {
  label: string;
  href: string;
};

export type EvidenceEntry = {
  id: string;
  shelf: EvidenceShelf;
  title: string;
  /** Краткий клинический вывод для врача. */
  summary: string;
  /** Практическая подсказка на УЗИ. */
  clinicalPearl: string;
  /** Цитируемая выдержка (guideline / abstract). */
  excerpt: string;
  tier: EvidenceTier;
  source: EvidenceSource;
  tags: string[];
  relatedLinks?: EvidenceRelatedLink[];
};
