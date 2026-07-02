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

export type CytologyScreeningInput = {
  age: number;
  sexuallyActive?: boolean;
  pregnant?: boolean;
  immunodeficient?: boolean;
  hivPositive?: boolean;
  postmenopausal?: boolean;
  lastPapMonthsAgo?: number | null;
  lastHpvMonthsAgo?: number | null;
  cytology?: CytologyBethesdaCode | null;
  hpvStatus?: CytologyHpvStatus;
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
