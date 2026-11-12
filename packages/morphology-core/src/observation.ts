import type { FeatureRegistry } from "./registry";
import {
  AI_PROVENANCES,
  ALTERNATIVE_ONLY_VALUE_KINDS,
  MORPHOLOGY_PROVENANCES,
  MORPHOLOGY_STATUSES,
  type MorphologyObservation,
  type MorphologyProvenance,
  type MorphologyValue,
  type ValidationIssue,
} from "./types";

const SUGGESTED_SOURCES: readonly MorphologyProvenance[] = [
  "ai_text_extraction",
  "ai_vision",
  "imported_data",
];

export function hasPayload(obs: Pick<MorphologyObservation, "value" | "measurement">): boolean {
  return obs.value != null || (obs.measurement != null && Number.isFinite(obs.measurement));
}

export function isAiProvenance(source: MorphologyProvenance): boolean {
  return AI_PROVENANCES.includes(source);
}

function isIsoTimestamp(value: string): boolean {
  return typeof value === "string" && value.length >= 10 && !Number.isNaN(Date.parse(value));
}

function isAlternativeOnly(value: MorphologyValue): boolean {
  return (ALTERNATIVE_ONLY_VALUE_KINDS as readonly string[]).includes(value.kind);
}

function valueIssues(
  obs: MorphologyObservation,
  value: MorphologyValue,
  registry: FeatureRegistry,
  asAlternative: boolean,
): ValidationIssue[] {
  const def = registry.get(obs.feature);
  if (!def) return [];
  const id = obs.id;
  const issue = (code: ValidationIssue["code"], message: string): ValidationIssue[] => [
    { code, message, observationId: id },
  ];

  if (value.kind === "not_assessed") return [];
  if (value.kind === "quantity") {
    if (!asAlternative) return [];
    if (def.valueType !== "quantity") return issue("value_type_mismatch", `${obs.feature} is not quantitative`);
    if (!Number.isFinite(value.value) || value.value < 0) {
      return issue("measurement_required", `${obs.feature}: quantity alternative must be a finite non-negative number`);
    }
    if (value.unit !== def.unit) return issue("unit_mismatch", `${obs.feature} expects unit ${def.unit}`);
    return [];
  }
  if (def.valueType === "quantity") {
    return issue(
      "value_type_mismatch",
      `${obs.feature} is quantitative: use measurement + unit (or a quantity alternative), not a ${value.kind} value`,
    );
  }
  if (value.kind !== def.valueType) {
    return [
      {
        code: "value_type_mismatch",
        message: `${obs.feature} expects ${def.valueType}, got ${value.kind}`,
        observationId: id,
      },
    ];
  }
  const allowed = new Set((def.allowedValues ?? []).map((v) => v.code));
  if (value.kind === "enum" && !allowed.has(value.code)) {
    return [
      {
        code: "value_not_allowed",
        message: `${obs.feature}: "${value.code}" is not an allowed value`,
        observationId: id,
      },
    ];
  }
  if (value.kind === "enum_set") {
    if (value.codes.length === 0) {
      return [
        {
          code: "value_required",
          message: `${obs.feature}: empty set is not a value — use not_assessed or an explicit code`,
          observationId: id,
        },
      ];
    }
    const bad = value.codes.filter((c) => !allowed.has(c));
    if (bad.length) {
      return [
        {
          code: "value_not_allowed",
          message: `${obs.feature}: not allowed ${bad.join(", ")}`,
          observationId: id,
        },
      ];
    }
  }
  return [];
}

/** Validates one observation against status / provenance invariants and (optionally) the registry. */
export function validateObservation(
  obs: MorphologyObservation,
  registry?: FeatureRegistry,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = obs.id;
  const push = (code: ValidationIssue["code"], message: string) =>
    issues.push({ code, message, observationId: id });

  if (!MORPHOLOGY_STATUSES.includes(obs.status)) push("invalid_shape", `Unknown status ${obs.status}`);
  if (!MORPHOLOGY_PROVENANCES.includes(obs.source)) push("invalid_shape", `Unknown source ${obs.source}`);
  if (!isIsoTimestamp(obs.timestamp)) push("invalid_timestamp", "timestamp must be ISO-8601");

  const def = registry?.get(obs.feature);
  if (registry && !def) push("unknown_feature", `Unknown feature ${obs.feature}`);
  if (def && def.anatomy !== obs.anatomy) {
    push("anatomy_mismatch", `${obs.feature} belongs to ${def.anatomy}, got ${obs.anatomy}`);
  }

  const payload = hasPayload(obs);

  switch (obs.status) {
    case "not_assessed":
    case "not_applicable":
      if (payload) push("value_forbidden", `status ${obs.status} must not carry a value`);
      if (obs.alternatives?.length) push("value_forbidden", `status ${obs.status} must not carry alternatives`);
      break;
    case "confirmed":
    case "suggested":
      if (!payload) push("value_required", `status ${obs.status} requires a value or measurement`);
      break;
    case "contradicted":
      if (!obs.alternatives || obs.alternatives.length < 2) {
        push("alternatives_required", "contradicted requires at least two alternatives");
      }
      if (obs.value != null) push("value_forbidden", "contradicted must not pick a winning value");
      break;
    case "uncertain":
      break;
  }

  if (obs.status === "confirmed" && isAiProvenance(obs.source) && !obs.confirmation) {
    push(
      "confirmation_required",
      "AI-derived observation can be confirmed only with an explicit physician confirmation",
    );
  }
  if (obs.status === "suggested" && !SUGGESTED_SOURCES.includes(obs.source)) {
    push(
      "suggested_requires_unconfirmed_source",
      "suggested is reserved for AI / imported data; physician input is confirmed or uncertain",
    );
  }

  if (obs.confidence != null) {
    const s = obs.confidence.score;
    if (!Number.isFinite(s) || s < 0 || s > 1) push("confidence_out_of_range", "confidence.score must be in [0,1]");
  }

  if (def?.valueType === "quantity" && obs.measurement != null) {
    if (!Number.isFinite(obs.measurement) || obs.measurement < 0) {
      push("measurement_required", "measurement must be a finite non-negative number");
    }
    if (obs.unit !== def.unit) push("unit_mismatch", `${obs.feature} expects unit ${def.unit}`);
  }
  if (def && def.valueType !== "quantity" && obs.measurement != null) {
    push("value_type_mismatch", `${obs.feature} is qualitative: measurement is not allowed`);
  }

  if (obs.value && isAlternativeOnly(obs.value)) {
    push("alternative_only_kind", `value kind "${obs.value.kind}" is allowed only in alternatives of a contradicted observation`);
  }
  if (obs.alternatives?.length && obs.status !== "contradicted") {
    push("value_forbidden", "alternatives are allowed only when status is contradicted");
  }

  if (registry && obs.value) issues.push(...valueIssues(obs, obs.value, registry, false));
  if (registry && obs.alternatives) {
    for (const alt of obs.alternatives) issues.push(...valueIssues(obs, alt, registry, true));
  }

  return issues;
}

/**
 * Review state, orthogonal to `status`: an AI-sourced observation without an explicit
 * physician `confirmation` is pending review whatever its status
 * (suggested, uncertain, not_assessed, contradicted …). Pending observations never
 * feed engines unless the caller explicitly opts into drafts.
 */
export function isPendingReview(obs: Pick<MorphologyObservation, "source" | "confirmation">): boolean {
  return isAiProvenance(obs.source) && !obs.confirmation;
}

/**
 * Physician accepts an observation **as stated** without turning it into a positive finding —
 * e.g. "yes, colour Doppler was not assessed". Keeps status and provenance.
 * Use `confirmObservation` to accept a value.
 */
export function acceptObservationStatus(obs: MorphologyObservation, at: string): MorphologyObservation {
  if (obs.status !== "not_assessed" && obs.status !== "not_applicable" && obs.status !== "uncertain") {
    throw new Error(`acceptObservationStatus is for not_assessed / not_applicable / uncertain, got ${obs.status}`);
  }
  return { ...obs, confirmation: { by: "physician", at } };
}

export function validateObservations(
  observations: readonly MorphologyObservation[],
  registry?: FeatureRegistry,
): ValidationIssue[] {
  const issues = observations.flatMap((o) => validateObservation(o, registry));
  const seen = new Set<string>();
  for (const o of observations) {
    if (seen.has(o.id)) issues.push({ code: "invalid_shape", message: `Duplicate id ${o.id}`, observationId: o.id });
    seen.add(o.id);
  }
  return issues;
}

/**
 * Explicit physician acceptance. Keeps original provenance (who proposed it) and
 * optionally replaces the value. Confidence alone never calls this.
 */
export function confirmObservation(
  obs: MorphologyObservation,
  at: string,
  patch?: Pick<MorphologyObservation, "value" | "measurement" | "unit">,
): MorphologyObservation {
  const next: MorphologyObservation = {
    ...obs,
    ...(patch ?? {}),
    status: "confirmed",
    alternatives: null,
    confirmation: { by: "physician", at },
  };
  if (!hasPayload(next)) {
    throw new Error(`Cannot confirm ${obs.feature} without a value or measurement`);
  }
  return next;
}

export function serializeObservations(observations: readonly MorphologyObservation[]): string {
  return JSON.stringify(observations);
}

export type ParseObservationsResult =
  | { ok: true; observations: MorphologyObservation[] }
  | { ok: false; issues: ValidationIssue[] };

function looksLikeObservation(x: unknown): x is MorphologyObservation {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.anatomy === "string" &&
    typeof o.feature === "string" &&
    typeof o.status === "string" &&
    typeof o.source === "string" &&
    typeof o.timestamp === "string" &&
    "value" in o
  );
}

export function parseObservations(json: string, registry?: FeatureRegistry): ParseObservationsResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, issues: [{ code: "invalid_shape", message: "Invalid JSON" }] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, issues: [{ code: "invalid_shape", message: "Expected an array" }] };
  }
  const bad = raw.findIndex((x) => !looksLikeObservation(x));
  if (bad >= 0) {
    return { ok: false, issues: [{ code: "invalid_shape", message: `Item ${bad} is not an observation` }] };
  }
  const observations = raw as MorphologyObservation[];
  const issues = validateObservations(observations, registry);
  return issues.length ? { ok: false, issues } : { ok: true, observations };
}
