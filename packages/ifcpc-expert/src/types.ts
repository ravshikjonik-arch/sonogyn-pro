/** IFCPC Colposcopy Nomenclature — Rio de Janeiro, 2011. */

export type IfcpcSourceId = "ifcpc-rio-2011";

export type IfcpcSectionId =
  | "adequacy"
  | "scj_visibility"
  | "transformation_zone_type"
  | "normal_findings"
  | "abnormal_grade1"
  | "abnormal_grade2"
  | "suspicious_invasion";

export type CinRiskLevel =
  | "none"
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type HsilAssociation = "none" | "unlikely" | "possible" | "likely" | "very_likely";

export type InvasionAssociation = "none" | "unlikely" | "possible" | "likely" | "very_likely";

export type BiopsyUrgency = "not_indicated" | "consider" | "recommended" | "mandatory" | "urgent";

/** Single IFCPC term with clinical teaching metadata. */
export interface IfcpcSignDefinition {
  id: string;
  sectionId: IfcpcSectionId;
  titleRu: string;
  titleEn: string;
  /** Official IFCPC English term (Rio 2011). */
  ifcpcTerm: string;
  definition: string;
  diagnosticSignificance: string;
  cinRiskLevel: CinRiskLevel;
  /** Narrative CIN risk (e.g. «CIN 1–2», «CIN 2+»). */
  cinRiskNarrative: string;
  hsilAssociation: HsilAssociation;
  hsilNarrative: string;
  invasionAssociation: InvasionAssociation;
  invasionNarrative: string;
  biopsyRecommendation: string;
  biopsyUrgency: BiopsyUrgency;
  /** Minor (1) / major (2) colposcopic feature — only for abnormal sections. */
  colposcopicGrade?: 1 | 2;
  /** Optional link to Swede Score criterion for the existing SonoGyn calculator. */
  swedeScoreHint?: string;
  tags?: string[];
}

export interface IfcpcSectionDefinition {
  id: IfcpcSectionId;
  titleRu: string;
  titleEn: string;
  description: string;
  /** Whether multiple signs can be selected within the section. */
  multiSelect: boolean;
  signIds: string[];
}

export interface IfcpcNomenclatureMeta {
  sourceId: IfcpcSourceId;
  title: string;
  version: string;
  publishedYear: 2011;
  disclaimer: string;
  references: string[];
}

export interface IfcpcNomenclatureDocument {
  $schema: string;
  meta: IfcpcNomenclatureMeta;
  sections: IfcpcSectionDefinition[];
  signs: IfcpcSignDefinition[];
}

/** Stored colposcopy exam — JSON payload for DB / API. */
export interface IfcpcColposcopyExam {
  schema: "ifcpc.colposcopy.exam";
  version: "1.0.0";
  examId?: string;
  patientId?: string;
  studyId?: string;
  performedAt: string;
  adequacyId: string;
  scjVisibilityId: string;
  transformationZoneTypeId: string;
  /** Selected sign ids from normal / abnormal / invasion sections. */
  findingSignIds: string[];
  quadrantNotes?: IfcpcQuadrantNote[];
  clinicalContext?: IfcpcClinicalContext;
  freeTextNotes?: string;
  physicianId?: string;
  institution?: string;
  /** Populated by assessIfcpcExam on save. */
  assessment?: IfcpcExamAssessment;
}

export type IfcpcQuadrant = "12" | "3" | "6" | "9";

export interface IfcpcQuadrantNote {
  quadrant: IfcpcQuadrant;
  signIds: string[];
  note?: string;
}

export interface IfcpcClinicalContext {
  referralIndication?: string;
  cytologyResult?: string;
  hpvResult?: string;
  priorTreatment?: string;
  swedeScoreTotal?: number;
}

export type IfcpcOverallImpression =
  | "normal"
  | "benign_variants"
  | "low_grade_changes"
  | "high_grade_suspicion"
  | "invasion_suspicion"
  | "inadequate_exam";

export interface IfcpcExamAssessment {
  overallImpression: IfcpcOverallImpression;
  highestColposcopicGrade: 0 | 1 | 2;
  biopsyUrgency: BiopsyUrgency;
  biopsyRationale: string;
  cinRiskSummary: string;
  hsilSummary: string;
  invasionSummary: string;
  recommendationText: string;
  selectedSignCount: number;
  flags: IfcpcAssessmentFlag[];
}

export type IfcpcAssessmentFlag =
  | "inadequate_exam"
  | "tz3_limitation"
  | "scj_not_visible"
  | "grade1_present"
  | "grade2_present"
  | "invasion_sign_present"
  | "normal_only";
