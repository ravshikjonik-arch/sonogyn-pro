/**
 * Woodward Diagnostic Imaging: Obstetrics (4th ed.) — structured pathology schema.
 * Отдельно от норм; только патология и клинические решения.
 */

export type WoodwardPathologyEntry = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  bookSection: string;
  bookPage: number;
  definition: string;
  epidemiology: string;
  embryology: string;
  ultrasound_findings: string[];
  doppler_findings: string[];
  mri_findings: string[];
  associated_anomalies: string[];
  genetic_associations: string[];
  differential_diagnosis: string[];
  red_flags: string[];
  follow_up: string[];
  prognosis: string;
  delivery_recommendations: string;
  postnatal_management: string;
  references: string[];
  /** Raw KEY FACTS blocks for audit / re-extraction */
  sourceBlocks?: Record<string, string[]>;
};

export type WoodwardKnowledgeFile = {
  module: string;
  moduleRu: string;
  source: {
    title: string;
    edition: string;
    authors: string[];
    isbn?: string;
  };
  version: string;
  extractedAt: string;
  entries: WoodwardPathologyEntry[];
};

export const KNOWLEDGE_FILES = [
  "first-trimester",
  "brain",
  "spine",
  "face-neck",
  "chest",
  "heart",
  "gastrointestinal",
  "genitourinary",
  "musculoskeletal",
  "placenta",
  "multiple-gestation",
  "aneuploidy",
  "syndromes",
  "infection",
  "growth-wellbeing",
  "maternal-conditions",
] as const;

export type KnowledgeFileId = (typeof KNOWLEDGE_FILES)[number];
