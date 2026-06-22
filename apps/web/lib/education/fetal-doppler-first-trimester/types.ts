export type FetalDopplerSectionId =
  | "introduction"
  | "safety"
  | "five-positions"
  | "fetal-heart"
  | "ductus-venosus"
  | "umbilical-arteries"
  | "umbilical-ring"
  | "uterine-arteries"
  | "common-pitfalls"
  | "sonogyn-educational-mode"
  | "case-library"
  | "assessment"
  | "visual-atlas";

export type FetalDopplerCaseLevel = "beginner" | "intermediate" | "advanced";

export type FetalDopplerCase = {
  id: string;
  level: FetalDopplerCaseLevel;
  title: string;
  clinicalScenario: string;
  ultrasoundFindings: string[];
  dopplerFindings: string[];
  interpretation: string;
  finalDiagnosis: string;
  teachingPoints: string[];
};

export type FetalDopplerEducationalCard = {
  id: FetalDopplerSectionId;
  learningObjectives: string[];
  keyPoints: string[];
  clinicalPearls: string[];
  residentTips: string[];
  examPearls: string[];
  faq: { q: string; a: string }[];
};

export type FetalDopplerAlgorithmStep = {
  step: number;
  action: string;
  detail?: string;
  branch?: string;
};

export type FetalDopplerAlgorithm = {
  id: string;
  title: string;
  indication: string;
  steps: FetalDopplerAlgorithmStep[];
};

export type FetalDopplerGlossaryEntry = {
  term: string;
  aliases?: string[];
  definition: string;
  sectionIds: FetalDopplerSectionId[];
};
