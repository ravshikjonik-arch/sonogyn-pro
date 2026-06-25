export type VascularSectionId =
  | "hemodynamics"
  | "pathology"
  | "equipment"
  | "extracranial"
  | "tcd"
  | "lower-limb-arteries"
  | "lower-limb-veins"
  | "upper-limb"
  | "abdominal-aorta"
  | "teaching-mode";

export type VascularCaseLevel = "beginner" | "intermediate" | "advanced";

export type VascularCase = {
  id: string;
  level: VascularCaseLevel;
  title: string;
  basin: string;
  clinicalScenario: string;
  ultrasoundFindings: string[];
  dopplerFindings: string[];
  interpretation: string;
  teachingPoints: string[];
};

export type VascularEducationalCard = {
  id: VascularSectionId;
  learningObjectives: string[];
  keyPoints: string[];
  residentTips: string[];
  examPearls: string[];
  faq: { q: string; a: string }[];
};

export type VascularQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sectionId: VascularSectionId;
};

export type VascularGlossaryEntry = {
  term: string;
  aliases?: string[];
  definition: string;
  sectionIds: VascularSectionId[];
};
