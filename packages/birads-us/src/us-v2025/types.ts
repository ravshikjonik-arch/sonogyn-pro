/** ACR BI-RADS v2025 ultrasound lexicon (extension of the 5th edition). Category assignment is the doctor's decision. */

export type BiradsCategory = "0" | "1" | "2" | "3" | "4A" | "4B" | "4C" | "5" | "6";

export type BiradsLesionKind = "mass" | "non_mass" | "special_case";

export type BiradsMassShape = "oval" | "lobulated" | "round" | "irregular";
export type BiradsOrientation = "parallel" | "non_parallel";
/** v2025: microlobulated is no longer a margin term (described as indistinct). */
export type BiradsMargin = "circumscribed" | "indistinct" | "angular" | "spiculated";
export type BiradsEchoPattern =
  | "anechoic"
  | "hyperechoic"
  | "mixed_solid_cystic"
  | "hypoechoic"
  | "isoechoic"
  | "heterogeneous";
/** v2025: "combined pattern" removed. */
export type BiradsPosterior = "none" | "enhancement" | "shadowing";

export type BiradsNmlDistribution = "focal" | "linear" | "segmental" | "regional";
export type BiradsNmlEcho = "hypoechoic" | "hyperechoic_heterogeneous";

export type BiradsCalcifications = "none" | "macro" | "micro";

export type BiradsAssociatedFeature =
  | "none"
  | "echogenic_pseudocapsule"
  | "echogenic_rind"
  | "architectural_distortion"
  | "duct_changes"
  | "skin_thickening"
  | "skin_retraction"
  | "edema";

export type BiradsVascularity = "avascular" | "internal" | "peripheral";

export type BiradsSpecialCase =
  | "simple_cyst"
  | "isolated_complicated_cyst"
  | "clustered_microcysts"
  | "intramammary_lymph_node"
  | "postsurgical_fluid"
  | "implant_or_foreign_body";

/** Every field optional: a missing answer is reported, never assumed benign. */
export type BiradsUsLesionInput = {
  kind?: BiradsLesionKind;
  shape?: BiradsMassShape;
  orientation?: BiradsOrientation;
  margin?: BiradsMargin;
  echoPattern?: BiradsEchoPattern;
  posterior?: BiradsPosterior;
  nmlDistribution?: BiradsNmlDistribution;
  nmlEcho?: BiradsNmlEcho;
  nmlPosterior?: BiradsPosterior;
  specialCase?: BiradsSpecialCase;
  calcifications?: BiradsCalcifications;
  /** Multi-select; "none" means the doctor checked and found none. */
  associated?: BiradsAssociatedFeature[];
  vascularity?: BiradsVascularity;
  /** Stable for at least 2–3 years on prior imaging (ACR: such findings may be reported as category 2). */
  stableOnPriors?: boolean;
  /** Final category chosen by the doctor. Never overwritten by the engine. */
  doctorCategory?: BiradsCategory;
};

export type BiradsUsField =
  | "kind"
  | "shape"
  | "orientation"
  | "margin"
  | "echoPattern"
  | "posterior"
  | "nmlDistribution"
  | "nmlEcho"
  | "nmlPosterior"
  | "specialCase"
  | "calcifications"
  | "associated";

export type BiradsSuspiciousFeature =
  | "irregular_shape"
  | "non_parallel"
  | "non_circumscribed_margin"
  | "mixed_solid_cystic"
  | "microcalcifications"
  | "architectural_distortion"
  | "duct_changes"
  | "skin_retraction";

export type BiradsSourceRef = { id: "ACR_BIRADS_US_2013" | "ACR_BIRADS_V2025"; citation: string; version: string };

/** How the engine reached (or did not reach) a category. */
export type BiradsPathway =
  | { kind: "determined"; category: BiradsCategory; reasonRu: string }
  | { kind: "needs_doctor"; options: BiradsCategory[]; reasonRu: string };

export type BiradsCategoryInfo = {
  category: BiradsCategory;
  labelRu: string;
  likelihoodRu: string;
  managementRu: string;
};

export type BiradsUsLesionResult =
  | { status: "invalid"; errors: { field: keyof BiradsUsLesionInput; messageRu: string }[] }
  | { status: "incomplete"; missing: BiradsUsField[]; messageRu: string }
  | {
      status: "ok";
      pathway: BiradsPathway;
      suspiciousFeatures: BiradsSuspiciousFeature[];
      /** Features that exclude the category 3 pathway without being clearly suspicious. */
      category3Blockers: string[];
      /** Final category: the doctor's choice if given, otherwise only a determined pathway; null = doctor must choose. */
      final: BiradsCategoryInfo | null;
      finalSource: "doctor" | "engine" | null;
      notesRu: string[];
      source: BiradsSourceRef;
      engineVersion: string;
    };
