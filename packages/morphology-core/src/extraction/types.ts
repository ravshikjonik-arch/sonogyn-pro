import type { ClassificationContextId, Laterality, MorphologyObservation } from "../types";

/** Anatomical site named in the text (finer than MorphologyAnatomy; used for compatibility checks). */
export type AnatomicalSite =
  | "ovary"
  | "fallopian_tube"
  | "adnexa"
  | "pelvis"
  | "uterus"
  | "myometrium"
  | "endometrium"
  | "cervix"
  | "breast"
  | "thyroid"
  | "neck_lymph_node"
  | "other";

/**
 * How one source sentence states the finding — certainty of the *statement*, independent of
 * extraction confidence. Lives in extraction evidence (ADR-MI-15 decision), not on the observation.
 * `conflicting` is not a per-statement assertion: it is a group outcome (status `contradicted`).
 */
export type ClinicalAssertion = "affirmed" | "negated" | "suspected" | "uncertain" | "not_assessed";

// ---------------------------------------------------------------------------
// Untrusted model payload (what the LLM is asked to return). Validated strictly.
// ---------------------------------------------------------------------------

export type ModelSubject = {
  ref: string;
  site: AnatomicalSite;
  laterality: Exclude<Laterality, "not_applicable" | "midline"> | null;
  lateralityText: string | null;
  sourceText: string | null;
};

export type ModelMention = {
  subjectRef: string | null;
  featureId: string | null;
  site: AnatomicalSite | null;
  assertion: ClinicalAssertion;
  valueCode: string | null;
  valueCodes: string[] | null;
  present: boolean | null;
  text: string | null;
  measurementText: string | null;
  sourceText: string;
  extractionConfidence: number;
  note: string | null;
};

export type ModelExtractionPayload = {
  subjects: ModelSubject[];
  mentions: ModelMention[];
};

// ---------------------------------------------------------------------------
// Result contract (shared by Web / React Native).
// ---------------------------------------------------------------------------

export type TextFragment = {
  text: string;
  /** Offsets in the original input text (UTF-16 code units). */
  start: number;
  end: number;
};

/** Per-observation audit trail. Keeps statement certainty separate from extraction confidence. */
export type ObservationEvidence = {
  observationId: string;
  fragments: TextFragment[];
  assertions: ClinicalAssertion[];
  /** Model value replaced by a registry code via label/synonym match. */
  normalizedFrom?: string;
  /** Raw measurement text, e.g. "3,5 см" (normalized value lives on the observation). */
  measurementText?: string;
};

export type UnresolvedReason =
  | "schema_violation"
  | "source_not_found_in_text"
  | "model_unmapped"
  | "unknown_feature"
  | "anatomy_mismatch"
  | "value_not_allowed"
  | "value_missing"
  | "negation_without_cue"
  | "negation_not_representable"
  | "inconsistent_negation"
  | "unit_unparsed"
  | "unknown_subject"
  | "not_assessed_without_cue"
  | "inconsistent_not_assessed"
  | "concept_mismatch"
  | "validation_failed";

export type UnresolvedMention = {
  text: string;
  reason: UnresolvedReason;
  detail: string;
  proposedFeatureId?: string | null;
  site?: AnatomicalSite | null;
  subjectRef?: string | null;
};

export type AmbiguityKind =
  | "hedged_statement"
  | "not_assessed_statement"
  | "conflicting_values"
  | "laterality_unverified"
  | "laterality_conflict"
  | "implausible_measurement"
  | "rule_parser_disagreement"
  | "rule_parser_found_unextracted";

export type ExtractionAmbiguity = {
  kind: AmbiguityKind;
  detail: string;
  featureId?: string;
  subjectRef?: string;
  fragments?: string[];
};

export type MissingInformationItem = {
  /** `null` for findings not tied to one subject (e.g. clinical context). */
  subjectRef: string | null;
  /** featureId, `a|b|c` (any one of), or `context.*`. */
  featureId: string;
  reason: "not_mentioned" | "needs_clarification" | "explicitly_not_assessed" | "clinical_context_required";
  /** Engine whose input needs this item (informational — no engine is called). */
  forClassification?: ClassificationContextId;
};

export type ExtractionValidationStatus =
  | "valid"
  | "valid_with_issues"
  | "invalid"
  | "blocked"
  | "provider_error";

export type BlockReason = "phi_detected" | "prompt_injection" | "empty_text" | "text_too_long" | "quota_exceeded";

export type ExtractionSubject = {
  ref: string;
  subjectId: string;
  site: AnatomicalSite;
  laterality: Laterality | null;
};

export type MorphologyExtractionResult = {
  extractionId: string;
  observations: MorphologyObservation[];
  evidence: ObservationEvidence[];
  subjects: ExtractionSubject[];
  unresolvedMentions: UnresolvedMention[];
  ambiguities: ExtractionAmbiguity[];
  missingInformation: MissingInformationItem[];
  /** Fingerprint only — the text itself is not copied into the result beyond fragments. */
  sourceTextReference: { charLength: number; fingerprint: string };
  extractionModel: { provider: string | null; model: string | null };
  promptVersion: string;
  extractionTimestamp: string;
  validationStatus: ExtractionValidationStatus;
  blockReason?: BlockReason;
  /** Human-readable reasons (never contains the input text). */
  issues: string[];
};
