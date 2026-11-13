/**
 * Universal Morphology Foundation — canonical contracts.
 *
 * Runtime-agnostic (Web / React Native / Node): no DOM, no Node built-ins.
 * This layer describes findings; it never computes a clinical category.
 */

/**
 * Assessment status of a single feature.
 *
 * - `confirmed`      — assessed and accepted by a clinician / structured source; value is authoritative.
 *                      A confirmed negative (e.g. papillae present = false) means "assessed and absent".
 * - `suggested`      — proposed by AI or imported data; NOT accepted by a clinician yet.
 * - `uncertain`      — assessed but the reader is not sure (value may hold the best guess).
 * - `not_assessed`   — not evaluated. Absence of a feature in a report is NOT clinical absence.
 * - `not_applicable` — the feature does not apply in this context (e.g. septa in a solid lesion).
 * - `contradicted`   — sources disagree; alternatives must be listed.
 */
export type MorphologyStatus =
  | "confirmed"
  | "suggested"
  | "uncertain"
  | "not_assessed"
  | "not_applicable"
  | "contradicted";

export const MORPHOLOGY_STATUSES: readonly MorphologyStatus[] = [
  "confirmed",
  "suggested",
  "uncertain",
  "not_assessed",
  "not_applicable",
  "contradicted",
] as const;

/** Where the observation came from. Provenance is never rewritten by confirmation. */
export type MorphologyProvenance =
  | "physician_input"
  | "structured_protocol"
  | "ai_text_extraction"
  | "ai_vision"
  | "imported_data";

export const MORPHOLOGY_PROVENANCES: readonly MorphologyProvenance[] = [
  "physician_input",
  "structured_protocol",
  "ai_text_extraction",
  "ai_vision",
  "imported_data",
] as const;

export const AI_PROVENANCES: readonly MorphologyProvenance[] = ["ai_text_extraction", "ai_vision"];

/** Anatomy scope of a feature definition / observation. Extend by union, not by renaming. */
export type MorphologyAnatomy =
  | "adnexa"
  | "pelvis"
  | "breast"
  | "thyroid"
  | "neck_lymph_nodes"
  | "uterus";

export type Laterality = "left" | "right" | "bilateral" | "midline" | "not_applicable";

export type ImagingPlane =
  | "sagittal"
  | "transverse"
  | "coronal"
  | "oblique"
  | "longitudinal"
  | "radial"
  | "antiradial"
  | "unspecified";

export type MeasurementUnit = "mm" | "cm" | "ml" | "cm_s" | "ratio" | "percent";

/**
 * Qualitative payload. Quantitative payload lives in `measurement` + `unit`.
 *
 * `quantity` and `not_assessed` are **alternative-only** kinds: they may appear only in
 * `alternatives` of a `contradicted` observation (e.g. "35 mm" vs "48 mm", or
 * "assessed: moderate flow" vs "not assessed"). They are never valid as `value`.
 */
export type MorphologyValue =
  | { kind: "enum"; code: string }
  | { kind: "enum_set"; codes: string[] }
  | { kind: "boolean"; present: boolean }
  | { kind: "text"; text: string }
  | { kind: "quantity"; value: number; unit: MeasurementUnit }
  | { kind: "not_assessed" };

export const ALTERNATIVE_ONLY_VALUE_KINDS = ["quantity", "not_assessed"] as const;

export type MorphologyValueType = "enum" | "enum_set" | "boolean" | "text" | "quantity";

/**
 * Extraction confidence — how sure the *extractor* is that it read the source correctly.
 * It is NOT clinical certainty and never promotes `suggested` → `confirmed`.
 */
export type ExtractionConfidence = {
  score: number;
  method: "model_self_report" | "model_logprob" | "rule_match" | "vision_model";
};

/** Engine / classification system identifiers known to the registry. */
export type ClassificationContextId =
  | "orads_us_pro"
  | "orads_us_2022"
  | "iota_adnex"
  | "iota_lr2"
  | "iota_simple_rules"
  | "birads_us"
  | "birads_mmg"
  | "tirads_acr"
  | "tirads_ru"
  | "musa_adenomyosis";

export type ObservationConfirmation = {
  by: "physician";
  at: string;
};

export type MorphologyObservation = {
  id: string;
  /** Groups observations of one finding (lesion / nodule / uterus). */
  subjectId?: string | null;
  anatomy: MorphologyAnatomy;
  /** `MorphologyFeatureDefinition.featureId`. */
  feature: string;
  value: MorphologyValue | null;
  status: MorphologyStatus;
  source: MorphologyProvenance;
  confidence?: ExtractionConfidence | null;
  laterality?: Laterality | null;
  plane?: ImagingPlane | null;
  measurement?: number | null;
  unit?: MeasurementUnit | null;
  /** ISO-8601. */
  timestamp: string;
  classificationContext?: ClassificationContextId[] | null;
  /** Definition version the observation was recorded against. */
  definitionVersion?: string | null;
  /** Required when status = `contradicted`. */
  alternatives?: MorphologyValue[] | null;
  /** Explicit physician acceptance of an AI/imported observation. */
  confirmation?: ObservationConfirmation | null;
  /** Verbatim span from the source text (extraction audit trail). */
  rawText?: string | null;
};

export type SourceReference = {
  label: string;
  year?: number;
  url?: string;
};

export type AllowedValue = {
  code: string;
  label: string;
  synonyms?: string[];
};

export type MorphologyFeatureDefinition = {
  featureId: string;
  displayName: string;
  anatomy: MorphologyAnatomy;
  valueType: MorphologyValueType;
  allowedValues?: AllowedValue[];
  unit?: MeasurementUnit;
  applicableClassifications: ClassificationContextId[];
  definitionVersion: string;
  sourceReference: SourceReference;
  definition?: string;
  synonyms?: string[];
};

export type ValidationIssue = {
  code:
    | "unknown_feature"
    | "anatomy_mismatch"
    | "value_required"
    | "value_forbidden"
    | "value_type_mismatch"
    | "value_not_allowed"
    | "alternative_only_kind"
    | "measurement_required"
    | "unit_mismatch"
    | "alternatives_required"
    | "confirmation_required"
    | "suggested_requires_unconfirmed_source"
    | "confidence_out_of_range"
    | "invalid_timestamp"
    | "invalid_shape";
  message: string;
  observationId?: string;
};
