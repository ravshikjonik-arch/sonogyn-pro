export type IotaModelSourceRef = {
  modelId: string;
  modelVersion: string;
  publication: string;
};

export type PapillaryCount = 0 | 1 | 2 | 3 | "4plus";

/** ADNEX model input (Van Calster BMJ 2014 / IOTA ADNEX app). */
export type AdnexInput = {
  ageYears: number;
  oncologyCenter: boolean;
  maxDiameterMm: number;
  maxSolidDiameterMm: number;
  moreThan10Locules: boolean;
  papillaryCount: PapillaryCount;
  acousticShadows: boolean;
  ascites: boolean;
  ca125Uml?: number;
};

export type AdnexOutcome =
  | "benign"
  | "borderline"
  | "stage1"
  | "stage2_4"
  | "metastatic";

export type AdnexResult = IotaModelSourceRef & {
  usedCa125: boolean;
  probabilities: Record<AdnexOutcome, number>;
  malignancyRisk: number;
};

export type Lr2Input = {
  ageYears: number;
  ascites: boolean;
  bloodFlowInSolidPapillary: boolean;
  maxSolidDiameterMm: number;
  irregularInternalWalls: boolean;
  acousticShadows: boolean;
};

export type Lr2Result = IotaModelSourceRef & {
  malignancyRisk: number;
};

export type SimpleRulesFeature =
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "B5"
  | "M1"
  | "M2"
  | "M3"
  | "M4"
  | "M5";

export type SimpleRulesVerdict = "benign" | "malignant" | "inconclusive";

export type SimpleRulesInput = {
  benignFeatures: SimpleRulesFeature[];
  malignantFeatures: SimpleRulesFeature[];
};

export type SimpleRulesResult = IotaModelSourceRef & {
  verdict: SimpleRulesVerdict;
  benignMatched: SimpleRulesFeature[];
  malignantMatched: SimpleRulesFeature[];
};

export type SimpleRulesRiskInput = {
  oncologyCenter: boolean;
  benignFeatures: SimpleRulesFeature[];
  malignantFeatures: SimpleRulesFeature[];
};

export type SimpleRulesRiskResult = IotaModelSourceRef & {
  malignancyRisk: number;
  regressionScore: number;
};

export type ValidationError = {
  field: string;
  messageKey: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

export type OradsCompareStatus =
  | "concordant"
  | "discordant_iota_higher"
  | "discordant_orads_higher"
  | "missing_orads";

export type OradsCompareResult = {
  status: OradsCompareStatus;
  iotaMalignancyRisk: number;
  oradsCategory: number | null;
  messageKey: string;
};
