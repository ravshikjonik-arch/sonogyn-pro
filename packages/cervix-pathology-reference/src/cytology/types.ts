export type CytologyTopicId =
  | "anatomy"
  | "transformation-zone"
  | "hpv"
  | "screening"
  | "liquid-cytology"
  | "conventional"
  | "sampling"
  | "sampling-errors"
  | "bethesda"
  | "hpv-testing"
  | "co-testing"
  | "algorithms"
  | "cases"
  | "quiz"
  | "ai-assist"
  | "lecture";

export type CytologyBethesdaCode =
  | "nilm"
  | "asc-us"
  | "asc-h"
  | "lsil"
  | "hsil"
  | "agc"
  | "ais"
  | "carcinoma"
  | "unsatisfactory";

export type CytologyHpvStatus = "negative" | "positive" | "16-positive" | "18-positive" | "unknown";

export type CytologyAudienceRole = "physician" | "resident" | "student";

export type CytologyKnowledgeLevel = "basic" | "advanced" | "expert";

export type HPVResult = CytologyHpvStatus;

export type CytologyScreeningInput = {
  age: number;
  sexuallyActive?: boolean;
  sexualDebutAge?: number | null;
  pregnant?: boolean;
  immunodeficient?: boolean;
  hivPositive?: boolean;
  postmenopausal?: boolean;
  lastPapMonthsAgo?: number | null;
  lastHpvMonthsAgo?: number | null;
  cytology?: CytologyBethesdaCode | null;
  hpvStatus?: CytologyHpvStatus;
  hpv16Positive?: boolean;
  hpv18Positive?: boolean;
  priorExcision?: boolean;
};

export type CytologyScreeningRecommendation = {
  summary: string;
  actionsNow: string[];
  nextScreeningMonths: number | null;
  hpvTestNeeded: boolean;
  colposcopyNeeded: boolean;
  repeatCytologyMonths: number | null;
  referSpecialist: boolean;
  missingData: string[];
  validationNotes: string[];
  riskLevel: "low" | "moderate" | "high";
  disclaimer: string;
  guidelineRefs: string[];
};

export type BethesdaAssistInput = {
  age: number;
  cytology: CytologyBethesdaCode;
  hpvStatus: CytologyHpvStatus;
  hpv16Positive?: boolean;
  hpv18Positive?: boolean;
  pregnant?: boolean;
  immunodeficient?: boolean;
  hivPositive?: boolean;
  priorExcision?: boolean;
  priorCytology?: CytologyBethesdaCode | null;
  colposcopyDone?: boolean;
  histology?: string | null;
};

export type BethesdaAssistResult = {
  interpretation: string;
  riskLevel: "low" | "moderate" | "high" | "critical";
  nextSteps: string[];
  explainToPatient: string;
  avoid: string[];
  missingData: string[];
  moduleLinks: { topic: CytologyTopicId; label: string }[];
  disclaimer: string;
};

export type CytologyAnatomyNode = {
  id: string;
  label: string;
  description: string;
  clinicalSignificance: string;
  cinLink: string;
  plainLanguage: string;
};

export type CytologyClinicalCase = {
  id: string;
  title: string;
  data: Record<string, unknown>;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topicRef: string;
  casesChannel: string;
};

export type BethesdaCategory = {
  id: string;
  code: string;
  title: string;
  plain: string;
  histology: string;
  hpvLink: string;
  doctorAction: string;
  colposcopy: string;
  biopsy: string;
  referral: string;
};

export type CytologyTopic = {
  id: CytologyTopicId;
  title: string;
  icon: string;
  summary: string;
};

export type CytologyAlgorithm = {
  chain: Array<{ step: string; label: string; description: string }>;
  links: Record<string, string>;
};

export type CytologySamplingError = {
  id: string;
  title: string;
  whyBad: string;
  cytologistSees: string;
  patientRisk: string;
  fix: string;
  prevent: string;
};

export type CytologyQuizQuestion = {
  id: string;
  category: string;
  level: "student" | "doctor";
  role?: CytologyAudienceRole;
  knowledgeLevel?: CytologyKnowledgeLevel;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceId: string;
};

export type CytologyQuizResult = {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  percentCorrect: number;
  recommendedTopics: CytologyTopicId[];
};

export type CervicalCytologyModule = {
  id: string;
  title: string;
  shortTitle: string;
  version: string;
  source: string;
  disclaimer: string;
  guidelines: string[];
  topics: CytologyTopic[];
};
