import type { FeatureRegistry } from "../registry";
import type {
  ClassificationContextId,
  Laterality,
  MorphologyProvenance,
  MorphologyStatus,
  ObservationConfirmation,
} from "../types";

export type AdapterIssueCode =
  | "invalid_observation"
  | "missing_required"
  | "unsupported_feature"
  | "unsupported_value"
  | "unsupported_transformation"
  | "conflicting_values"
  | "contradicted"
  | "not_confirmed_excluded"
  | "non_confirmed_used"
  | "engine_default_risk"
  | "incomplete_for_engine"
  | "inconsistent_features"
  | "laterality_conflict"
  | "lossy_field";

export type AdapterIssue = {
  code: AdapterIssueCode;
  message: string;
  featureId?: string;
  observationId?: string;
  engineKey?: string;
};

/** Statuses that may feed an engine. `confirmed` only by default. */
export type AcceptedStatus = Extract<MorphologyStatus, "confirmed" | "suggested" | "uncertain">;

export type ToEngineOptions = {
  registry?: FeatureRegistry;
  /** Default `["confirmed"]`. Adding suggested/uncertain is for drafts and always warns. */
  acceptStatuses?: AcceptedStatus[];
  /** Restrict to one finding when observations of several lesions are passed. */
  subjectId?: string;
  /**
   * Default `false`: features the engine (or its existing mapper) would silently default
   * block the conversion. `true` returns `completeness: "partial"` for explicit draft use.
   */
  allowPartial?: boolean;
};

export type ToEngineSuccess<T> = {
  ok: true;
  engineId: ClassificationContextId;
  input: T;
  usedObservationIds: string[];
  warnings: AdapterIssue[];
  notAssessed: string[];
  notApplicable: string[];
  /** `partial` only when the caller passed `allowPartial: true`. */
  completeness: "complete" | "partial";
  /** Features the engine will default because they were not explicitly stated. */
  incompleteFeatures: string[];
};

export type ToEngineFailure = {
  ok: false;
  engineId: ClassificationContextId;
  /** Feature ids (or `context.*`) that block a valid engine input. */
  missing: string[];
  errors: AdapterIssue[];
  warnings: AdapterIssue[];
};

export type ToEngineResult<T> = ToEngineSuccess<T> | ToEngineFailure;

export type FromEngineOptions = {
  source: MorphologyProvenance;
  timestamp: string;
  subjectId?: string;
  /** Defaults: physician_input / structured_protocol → confirmed; otherwise suggested. */
  status?: Extract<MorphologyStatus, "confirmed" | "suggested" | "uncertain">;
  laterality?: Laterality;
  idPrefix?: string;
  confirmation?: ObservationConfirmation;
};

export type FromEngineResult<TContext = undefined> = {
  observations: import("../types").MorphologyObservation[];
  /** Engine fields that could not be represented (explicit information loss). */
  lossy: AdapterIssue[];
  context: TContext;
};
