export type FetalAnatomyRegion =
  | "overview"
  | "spine"
  | "head-brain"
  | "heart"
  | "abdomen"
  | "pelvis"
  | "limbs"
  | "face"
  | "whole-body";

export type FetalAnatomyViewId =
  | "overview-1"
  | "view-01-spine-sagittal"
  | "view-02-spine-coronal"
  | "view-03-trunk-coronal"
  | "view-04-transventricular"
  | "view-05-transthalamic"
  | "view-06-transcerebellar"
  | "view-07a-apical-four-chamber"
  | "view-07b-lateral-four-chamber"
  | "view-08-lvot"
  | "view-09-rvot"
  | "view-09b-crossing-outflow"
  | "view-10-three-vessel-trachea"
  | "view-11-umbilical-vein"
  | "view-12-cord-insertion"
  | "view-13-kidneys"
  | "view-14-bladder-arteries"
  | "view-15-femur"
  | "view-16-lower-limbs"
  | "view-17-upper-limbs"
  | "view-18-upper-lip"
  | "view-19-orbits"
  | "view-20-profile"
  | "overview-2";

export type FetalAnatomyView = {
  id: FetalAnatomyViewId;
  number: number | string;
  region: FetalAnatomyRegion;
  title: string;
  titleRu: string;
  plane: string;
  probeOrientation: string;
  howToObtain: string[];
  normalAnatomy: string[];
  keyLandmarks: string[];
  commonMistakes: string[];
  clinicalSignificance: string;
  excludesAnomalyIds: string[];
  atlasNormal: string;
  atlasPathology: string;
};

export type FetalAnomalySeverity = "critical" | "major" | "moderate" | "minor";

export type FetalAnomalyRecord = {
  id: string;
  name: string;
  nameRu: string;
  definition: string;
  embryology?: string;
  ultrasoundFindings: string[];
  differentialDiagnosis: string[];
  prognosis: string;
  associatedSyndromes?: string[];
  recommendedFollowUp: string[];
  relatedViewIds: FetalAnatomyViewId[];
  severity: FetalAnomalySeverity;
  searchableText: string;
};

export type FetalAnatomyCaseLevel = "beginner" | "intermediate" | "advanced";

export type FetalAnatomyCase = {
  id: string;
  level: FetalAnatomyCaseLevel;
  title: string;
  history: string;
  ultrasoundFindings: string[];
  relatedViewIds: FetalAnatomyViewId[];
  diagnosis: string;
  teachingPoints: string[];
};

export type FetalAnatomyEducationalCard = {
  viewId: FetalAnatomyViewId | "introduction";
  learningObjectives: string[];
  keyPoints: string[];
  clinicalPearls: string[];
  residentTips: string[];
  examinationTips: string[];
  commonMistakes: string[];
};
