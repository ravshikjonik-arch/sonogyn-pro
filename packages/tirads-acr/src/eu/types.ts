/** EU-TIRADS (ETA) — pattern-based classification, not a point system. Independent of ACR TI-RADS. */

export type EuTiradsCategory = 1 | 2 | 3 | 4 | 5;

export type EuComposition = "no_nodule" | "pure_cyst" | "entirely_spongiform" | "mixed" | "solid";

/** Echogenicity of the solid component. */
export type EuEchogenicity = "hyperechoic" | "isoechoic" | "mildly_hypoechoic" | "markedly_hypoechoic";

export type EuShape = "oval" | "non_oval";

export type EuMargins = "smooth" | "ill_defined" | "irregular";

export type EuMicrocalcifications = "absent" | "present";

export type EuExtrathyroidalExtension = "none" | "suspected" | "definite";

export type EuLymphNodes = "not_assessed" | "normal" | "indeterminate" | "suspicious";

export type EuPolicyProfile = "RU_KR_2024" | "ETA_2023";

/** Every field is optional on purpose: a missing answer is reported, never treated as benign. */
export type EuTiradsInput = {
  composition?: EuComposition;
  echogenicity?: EuEchogenicity;
  shape?: EuShape;
  margins?: EuMargins;
  microcalcifications?: EuMicrocalcifications;
  maxDiameterMm?: number;
  extrathyroidalExtension?: EuExtrathyroidalExtension;
  lymphNodes?: EuLymphNodes;
  isPediatric?: boolean;
  /** Doctor is unsure whether a high-suspicion feature is present (ETA suggests EU-TIRADS 4). */
  highRiskFeaturesUncertain?: boolean;
};

export type EuFeatureField = "composition" | "echogenicity" | "shape" | "margins" | "microcalcifications";

export type EuHighRiskFeature = "non_oval_shape" | "irregular_margins" | "microcalcifications" | "marked_hypoechogenicity";

export type EuSourceRef = {
  id: "EU_TIRADS_2017" | "ETA_2023" | "RU_KR_2024";
  citation: string;
  version: string;
};

export type EuWarning = {
  code:
    | "definite_ete"
    | "suspected_ete"
    | "suspicious_lymph_nodes"
    | "indeterminate_lymph_nodes"
    | "pediatric"
    | "high_risk_uncertain"
    | "features_not_assessed";
  messageRu: string;
  source?: EuSourceRef;
};

export type EuFnaDecision = "indicated" | "consider" | "not_indicated" | "undetermined";

export type EuManagement = {
  profile: EuPolicyProfile;
  fna: EuFnaDecision;
  fnaReasonRu: string;
  /** null when the selected profile gives no category-based interval. */
  followUpRu: string | null;
  source: EuSourceRef;
};

export type EuValidationError = { field: keyof EuTiradsInput; messageRu: string };

export type EuTiradsResult =
  | {
      status: "invalid";
      errors: EuValidationError[];
    }
  | {
      status: "incomplete";
      missing: EuFeatureField[];
      messageRu: string;
    }
  | {
      status: "ok";
      category: EuTiradsCategory;
      categoryLabelRu: string;
      malignancyRiskRu: string;
      highRiskFeatures: EuHighRiskFeature[];
      /** Answers that were not given but did not change the category (e.g. EU-TIRADS 5 already set). */
      notAssessed: EuFeatureField[];
      rationaleRu: string[];
      management: EuManagement;
      warnings: EuWarning[];
      classificationSource: EuSourceRef;
      engineVersion: string;
    };
