/**
 * MI Orchestrator contracts — shared by Web and React Native.
 * Plain JSON-serializable data only (ISO strings, no Date/Map/functions).
 * Reuses `@repo/morphology-core` types; no parallel observation or extraction schema.
 */
import type { AssistantAnswer } from "@repo/evidence-retrieval/types";
import type {
  MeasurementUnit,
  MorphologyObservation,
  MorphologyValue,
  OradsClinicalContext,
  AdapterIssue,
} from "@repo/morphology-core";
import type { MorphologyExtractionResult } from "@repo/morphology-core/extraction";

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export type MiWorkflowState =
  | "received"
  | "validating"
  | "extracting"
  | "awaiting_physician_review"
  | "ready_for_classification"
  | "classifying"
  | "retrieving_evidence"
  | "completed"
  | "incomplete"
  | "blocked"
  | "failed";

/** Terminal states of one request. */
export type MiStatus = Extract<
  MiWorkflowState,
  "completed" | "incomplete" | "blocked" | "failed" | "awaiting_physician_review"
>;

export type MiInputType = "free_text" | "structured_morphology" | "clinical_question" | "classification_request";

/** Engines integrated in Phase C (readiness-reviewed). Others are rejected as unsupported. */
export const MI_SUPPORTED_ENGINES = ["orads_us_pro", "birads_us", "tirads_acr", "musa_adenomyosis"] as const;
export type MiEngineId = (typeof MI_SUPPORTED_ENGINES)[number];

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

/** Explicit physician actions. There is no "auto" action and no default choice. */
export type ReviewDecision =
  | { observationId: string; action: "confirm" }
  | {
      observationId: string;
      action: "correct";
      value?: MorphologyValue | null;
      measurement?: number | null;
      unit?: MeasurementUnit | null;
    }
  | { observationId: string; action: "reject"; reason?: string }
  /** Accept not_assessed / not_applicable / uncertain *as stated* (never becomes a value). */
  | { observationId: string; action: "accept_status" }
  /** Resolve a contradiction by explicitly picking one listed alternative. */
  | { observationId: string; action: "choose_alternative"; alternativeIndex: number };

type RequestBase = {
  requestId?: string;
  /** Same key (per user) within the TTL replays the first result instead of re-running providers. */
  idempotencyKey?: string;
};

export type MedicalIntelligenceRequest =
  | (RequestBase & { inputType: "free_text"; text: string })
  | (RequestBase & {
      inputType: "structured_morphology";
      observations: MorphologyObservation[];
      reviewDecisions?: ReviewDecision[];
      reviewedAt?: string;
    })
  | (RequestBase & {
      inputType: "classification_request";
      engineId: string;
      observations: MorphologyObservation[];
      reviewDecisions?: ReviewDecision[];
      reviewedAt?: string;
      /** Non-morphologic O-RADS inputs (menopause, age, cycle day, centre type). */
      clinicalContext?: OradsClinicalContext;
      subjectId?: string;
      includeEvidence?: boolean;
    })
  | (RequestBase & { inputType: "clinical_question"; question: string; corpusMode?: string });

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export type MiIssue = {
  code: string;
  message: string;
  stage: MiWorkflowState;
  featureId?: string;
  observationId?: string;
};

export type ReviewGateSummary = {
  /** AI (or imported) observations awaiting explicit physician action. */
  pending: string[];
  confirmed: string[];
  corrected: { observationId: string; before: MorphologyObservation; after: MorphologyObservation }[];
  rejected: { observationId: string; reason?: string }[];
  acceptedAsStated: string[];
  unresolvedContradictions: string[];
  /** Stated not assessed — never treated as a negative finding. */
  notAssessed: string[];
};

export type EngineReadiness = {
  engineId: MiEngineId;
  ready: boolean;
  missing: string[];
  blockingIssues: string[];
};

export type ClassificationSection = {
  engineId: string | null;
  status: "computed" | "not_computed" | "not_requested";
  engineVersion?: string;
  sourceLabel?: string;
  /** Exact engine input (from the morphology adapter). */
  engineInput?: Record<string, unknown>;
  /** Raw engine output, unmodified. */
  engineResult?: Record<string, unknown>;
  /** Short deterministic label taken from the engine output (e.g. "O-RADS 4", "TR5"). */
  categoryLabel?: string;
  usedObservationIds?: string[];
  abstention?: {
    reason: string;
    available: string[];
    missing: string[];
    needsClarification: string[];
  };
  adapterIssues?: AdapterIssue[];
  readiness?: EngineReadiness[];
  disclaimer?: string;
};

export type MiEvidenceReference = {
  index: number;
  sourceId: string;
  provider: string;
  title: string;
  url: string;
  recordType: string;
  year?: number;
  journal?: string;
  doi?: string;
  pmid?: string;
  section?: string;
  /** Short quote returned by the provider (never generated). */
  passage?: string;
  evidenceLevel?: string;
};

export type EvidenceSection = {
  status: "found" | "insufficient" | "failed" | "skipped";
  query: string;
  corpusMode?: string;
  synthesisMode?: AssistantAnswer["synthesisMode"];
  evidenceStrength?: AssistantAnswer["evidenceStrength"];
  summary?: string;
  references: MiEvidenceReference[];
  /** Result of the existing `postValidateEvidenceAnswer`. */
  validation?: { ok: boolean; reasons: string[]; replaced: boolean };
  validatedText?: string;
  providerStatuses?: Record<string, string>;
  error?: string;
  /** Fields the evidence stack does not provide (never fabricated). */
  limitations: string[];
};

export type MedicalIntelligenceResult = {
  requestId: string;
  status: MiStatus;
  inputType: MiInputType;
  stateHistory: { state: MiWorkflowState; at: string; reason?: string }[];
  /** AI interpretation (Phase B result, unmodified). */
  extraction: MorphologyExtractionResult | null;
  /** Observations after the physician review gate. */
  morphology: { observations: MorphologyObservation[]; review: ReviewGateSummary } | null;
  /** Deterministic classification (existing engine). */
  classification: ClassificationSection | null;
  /** Evidence-based explanation (existing evidence stack). */
  evidence: EvidenceSection | null;
  warnings: MiIssue[];
  /** What blocks progress or needs physician / data action. */
  unresolvedIssues: MiIssue[];
  provenance: {
    aiSuggestedObservationIds: string[];
    physicianConfirmedObservationIds: string[];
    classificationEngine: string | null;
    evidenceProviders: string[];
  };
  modelVersion: {
    extractionModel?: string | null;
    extractionProvider?: string | null;
    extractionPromptVersion?: string;
    engineVersion?: string;
    evidenceSynthesisMode?: string;
  };
  processingMetadata: {
    startedAt: string;
    finishedAt: string;
    stages: { stage: MiWorkflowState; outcome: string }[];
    providerCalls: { extraction: number; evidence: number };
    idempotentReplay: boolean;
  };
  disclaimer: string;
};

export const MI_DISCLAIMER =
  "CDS: справочная поддержка решения. Не является диагнозом; интерпретация и решение — за лечащим врачом.";
