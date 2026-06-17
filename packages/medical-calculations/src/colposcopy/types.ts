/** Swede Score (IFCPC 2011) — 5 признаков, каждый 0–2 балла. */

export type SwedeCriterionKey = "acetowhite" | "margins" | "vessels" | "lesionSize" | "iodine";

export type SwedeScoreLevel = 0 | 1 | 2;

export type SwedeScoreInput = Record<SwedeCriterionKey, SwedeScoreLevel>;

export type SwedeRiskLevel = "low" | "moderate" | "high";

export type SwedeScoreResult = {
  total: number;
  breakdown: SwedeScoreInput;
  riskLevel: SwedeRiskLevel;
  riskLabel: string;
  recommendation: string;
  cinRiskHint: string;
};

export type ColposcopyComplaintKey =
  | "cycle_disorder"
  | "pain"
  | "discharge"
  | "infertility"
  | "vulvodynia"
  | "other";

export type CervixShapeKey = "cylindrical" | "conical" | "flat" | "hypertrophied";

/** Ключевые находки по стандартному бланку кольпоскопии. */
export type ColposcopyFindingKey =
  | "tz_incomplete"
  | "tz_high_grade"
  | "open_glands"
  | "retention_cyst"
  | "atypical_vessels"
  | "mosaicism"
  | "punctuation"
  | "keratosis"
  | "ectopy"
  | "endometriosis";

export type ColposcopyAnamnesisKey =
  | "sti_chlamydia"
  | "sti_hpv"
  | "sti_hsv"
  | "sti_gonorrhea"
  | "sti_syphilis"
  | "path_dysplasia"
  | "path_leukoplakia"
  | "path_erosion"
  | "screen_hpv"
  | "screen_cytology"
  | "screen_biopsy"
  | "contraception_coc"
  | "contraception_iud"
  | "contraception_condom"
  | "treatment_laser"
  | "treatment_cryo"
  | "treatment_leep";

export type ColposcopyProtocolInput = {
  patientName: string;
  patientAge: string;
  patientId: string;
  complaints: ColposcopyComplaintKey[];
  complaintsOther: string;
  anamnesis: ColposcopyAnamnesisKey[];
  anamnesisNotes: string;
  ageFirstSex: string;
  births: string;
  abortions: string;
  lmp: string;
  smokes: boolean;
  cigarettesPerDay: string;
  cervixShape: CervixShapeKey | "";
  findings: ColposcopyFindingKey[];
  acetowhiteEpithelium: "none" | "delicate" | "dense";
  marginQuality: "sharp" | "blurred";
  iodineZone: "positive" | "partial" | "negative";
  colposcopicDiagnosis: string;
  clinicalDiagnosis: string;
  recommendations: string;
  physicianName: string;
  institution: string;
};

export type ColposcopySession = {
  id: string;
  savedAt: string;
  protocol: ColposcopyProtocolInput;
  swede: SwedeScoreInput;
  swedeResult: SwedeScoreResult;
  conclusionText: string;
  templateId?: string;
};

export type ColposcopyTemplate = {
  id: string;
  name: string;
  text: string;
};
