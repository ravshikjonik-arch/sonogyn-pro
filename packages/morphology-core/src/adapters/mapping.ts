import { defaultFeatureRegistry } from "../features";
import { hasPayload, isPendingReview, validateObservations } from "../observation";
import type {
  ClassificationContextId,
  Laterality,
  MorphologyAnatomy,
  MorphologyObservation,
  MorphologyValue,
} from "../types";
import type {
  AcceptedStatus,
  AdapterIssue,
  FromEngineOptions,
  ToEngineOptions,
  ToEngineResult,
} from "./types";

/**
 * One canonical feature ↔ one engine input key.
 * `toEngine` translates canonical codes to engine codes (reverse is derived).
 * `notAssessedEngineValue` / `notApplicableEngineValue` exist only where the
 * engine lexicon itself encodes these states as values.
 */
export type FieldMapping = {
  featureId: string;
  key: string;
  kind: "enum" | "enum_set" | "boolean" | "quantity" | "text";
  toEngine?: Record<string, string>;
  notAssessedEngineValue?: string;
  notApplicableEngineValue?: string;
};

export type AdapterSpec = {
  engineId: ClassificationContextId;
  anatomies: MorphologyAnatomy[];
  mappings: FieldMapping[];
  /** Canonical feature ids that must resolve for a valid engine input. */
  required: string[];
};

export type BuiltFields = {
  fields: Record<string, unknown>;
  used: string[];
  errors: AdapterIssue[];
  warnings: AdapterIssue[];
  notAssessed: string[];
  notApplicable: string[];
  missing: string[];
  laterality?: Laterality;
};

const sameValue = (a: MorphologyObservation, b: MorphologyObservation) =>
  JSON.stringify([a.value, a.measurement ?? null]) === JSON.stringify([b.value, b.measurement ?? null]);

function toEngineValue(m: FieldMapping, obs: MorphologyObservation): { ok: true; value: unknown } | { ok: false } {
  const value = obs.value;
  switch (m.kind) {
    case "quantity":
      return obs.measurement != null ? { ok: true, value: obs.measurement } : { ok: false };
    case "boolean":
      return value?.kind === "boolean" ? { ok: true, value: value.present } : { ok: false };
    case "text":
      return value?.kind === "text" ? { ok: true, value: value.text } : { ok: false };
    case "enum_set":
      return value?.kind === "enum_set"
        ? { ok: true, value: value.codes.map((c) => m.toEngine?.[c] ?? c) }
        : { ok: false };
    case "enum": {
      if (value?.kind !== "enum") return { ok: false };
      if (m.toEngine && !(value.code in m.toEngine)) return { ok: false };
      return { ok: true, value: m.toEngine?.[value.code] ?? value.code };
    }
  }
}

export function buildEngineFields(
  observations: readonly MorphologyObservation[],
  spec: AdapterSpec,
  options: ToEngineOptions = {},
): BuiltFields {
  const registry = options.registry ?? defaultFeatureRegistry;
  const accept = new Set<AcceptedStatus>(options.acceptStatuses ?? ["confirmed"]);
  const out: BuiltFields = {
    fields: {},
    used: [],
    errors: [],
    warnings: [],
    notAssessed: [],
    notApplicable: [],
    missing: [],
  };

  const scoped = options.subjectId
    ? observations.filter((o) => o.subjectId === options.subjectId)
    : [...observations];

  for (const issue of validateObservations(scoped, registry)) {
    out.errors.push({ code: "invalid_observation", message: issue.message, observationId: issue.observationId });
  }
  if (out.errors.length) return out;

  const mapped = new Set(spec.mappings.map((m) => m.featureId));
  for (const o of scoped) {
    if (!mapped.has(o.feature) || !spec.anatomies.includes(o.anatomy)) {
      out.warnings.push({
        code: "unsupported_feature",
        message: `${o.feature} is not consumed by ${spec.engineId}; ignored`,
        featureId: o.feature,
        observationId: o.id,
      });
    }
  }

  const lateralities = new Set<Laterality>();
  // Drafts (caller accepts suggested/uncertain) may also use AI observations still pending review.
  const draft = accept.has("suggested") || accept.has("uncertain");

  for (const m of spec.mappings) {
    const all = scoped.filter((o) => o.feature === m.featureId);
    if (!all.length) continue;

    const group = draft ? all : all.filter((o) => !isPendingReview(o));
    if (!group.length) {
      out.warnings.push({
        code: "not_confirmed_excluded",
        message: `${m.featureId} has only AI observations pending physician review (${[
          ...new Set(all.map((o) => o.status)),
        ].join("/")}) — excluded`,
        featureId: m.featureId,
      });
      continue;
    }

    // A contradiction is never resolved by the adapter: excluding it would make the engine
    // treat the feature as absent (and possibly default it), so the whole conversion blocks.
    if (group.some((o) => o.status === "contradicted")) {
      out.errors.push({
        code: "contradicted",
        message: `${m.featureId} is contradicted between sources — resolve before classification`,
        featureId: m.featureId,
      });
      continue;
    }

    const accepted = group.filter((o) => accept.has(o.status as AcceptedStatus) && hasPayload(o));
    if (!accepted.length) {
      if (group.every((o) => o.status === "not_assessed")) {
        out.notAssessed.push(m.featureId);
        if (m.notAssessedEngineValue !== undefined) out.fields[m.key] = m.notAssessedEngineValue;
      } else if (group.every((o) => o.status === "not_applicable")) {
        out.notApplicable.push(m.featureId);
        if (m.notApplicableEngineValue !== undefined) out.fields[m.key] = m.notApplicableEngineValue;
      } else {
        out.warnings.push({
          code: "not_confirmed_excluded",
          message: `${m.featureId} has only ${[...new Set(group.map((o) => o.status))].join("/")} observations — excluded`,
          featureId: m.featureId,
        });
      }
      for (const o of group) {
        if (isPendingReview(o)) {
          out.warnings.push({
            code: "non_confirmed_used",
            message: `${m.featureId} ${o.status} taken from an AI observation pending review — draft only`,
            featureId: m.featureId,
            observationId: o.id,
          });
        }
      }
      continue;
    }

    const first = accepted[0]!;
    if (accepted.some((o) => !sameValue(o, first))) {
      out.errors.push({
        code: "conflicting_values",
        message: `${m.featureId} has conflicting accepted values`,
        featureId: m.featureId,
      });
      continue;
    }

    const converted = toEngineValue(m, first);
    if (!converted.ok) {
      out.errors.push({
        code: "unsupported_value",
        message: `${m.featureId}: value cannot be represented in ${spec.engineId}`,
        featureId: m.featureId,
        observationId: first.id,
        engineKey: m.key,
      });
      continue;
    }

    out.fields[m.key] = converted.value;
    out.used.push(...accepted.map((o) => o.id));
    for (const o of accepted) {
      if (o.status !== "confirmed") {
        out.warnings.push({
          code: "non_confirmed_used",
          message: `${m.featureId} used with status ${o.status} — draft only, not a confirmed input`,
          featureId: m.featureId,
          observationId: o.id,
        });
      }
      if (o.laterality && o.laterality !== "not_applicable") lateralities.add(o.laterality);
    }
  }

  if (lateralities.size === 1) out.laterality = [...lateralities][0];
  if (lateralities.size > 1) {
    out.errors.push({
      code: "laterality_conflict",
      message: `Observations of one finding disagree on laterality (${[...lateralities].join(", ")}) — resolve before classification`,
    });
  }

  const resolved = new Set(
    spec.mappings.filter((m) => m.key in out.fields).map((m) => m.featureId),
  );
  for (const req of spec.required) {
    if (!resolved.has(req)) out.missing.push(req);
  }

  return out;
}

/** Feature is stated: resolved into a field, or explicitly declared not_applicable. */
export function isExplicitlyStated(built: BuiltFields, spec: AdapterSpec, featureId: string): boolean {
  const m = spec.mappings.find((x) => x.featureId === featureId);
  if (built.notApplicable.includes(featureId)) return true;
  return Boolean(m && m.key in built.fields && !built.notAssessed.includes(featureId));
}

export function hasAnyResolved(built: BuiltFields, spec: AdapterSpec, featureIds: readonly string[]): boolean {
  return featureIds.some((f) => {
    const m = spec.mappings.find((x) => x.featureId === f);
    return Boolean(m && m.key in built.fields && !built.notAssessed.includes(f));
  });
}

/**
 * Shared exit: hard `missing` and errors always fail; `incomplete` (engine would default)
 * fails unless `allowPartial`, in which case the result is marked partial.
 */
export function finalizeEngineInput<T>(
  engineId: ClassificationContextId,
  built: BuiltFields,
  parts: {
    input: T;
    missing: string[];
    errors: AdapterIssue[];
    warnings: AdapterIssue[];
    incomplete: string[];
  },
  options: ToEngineOptions,
): ToEngineResult<T> {
  const warnings = [...parts.warnings];
  const errors = [...parts.errors];
  const missing = [...parts.missing];

  if (parts.incomplete.length) {
    const issue = {
      message: `Not explicitly stated: ${parts.incomplete.join(", ")} — ${engineId} would apply its own defaults`,
    };
    if (options.allowPartial) {
      warnings.push({ code: "engine_default_risk", ...issue });
    } else {
      errors.push({ code: "incomplete_for_engine", ...issue });
      missing.push(...parts.incomplete);
    }
  }

  if (errors.length || missing.length) {
    return { ok: false, engineId, missing, errors, warnings };
  }
  return {
    ok: true,
    engineId,
    input: parts.input,
    usedObservationIds: built.used,
    warnings,
    notAssessed: built.notAssessed,
    notApplicable: built.notApplicable,
    completeness: parts.incomplete.length ? "partial" : "complete",
    incompleteFeatures: parts.incomplete,
  };
}

function reverseEnum(m: FieldMapping, engineValue: string): string | undefined {
  if (!m.toEngine) return engineValue;
  return Object.entries(m.toEngine).find(([, e]) => e === engineValue)?.[0];
}

function defaultStatus(source: FromEngineOptions["source"]) {
  return source === "physician_input" || source === "structured_protocol" ? "confirmed" : "suggested";
}

export function buildObservationsFromFields(
  input: Record<string, unknown>,
  spec: AdapterSpec,
  options: FromEngineOptions,
  ignoredKeys: readonly string[] = [],
): { observations: MorphologyObservation[]; lossy: AdapterIssue[] } {
  const registry = defaultFeatureRegistry;
  const status = options.status ?? defaultStatus(options.source);
  const prefix = options.idPrefix ?? options.subjectId ?? "obs";
  const observations: MorphologyObservation[] = [];
  const lossy: AdapterIssue[] = [];

  const base = (m: FieldMapping) => {
    const def = registry.get(m.featureId);
    return {
      id: `${prefix}:${m.featureId}`,
      subjectId: options.subjectId ?? null,
      anatomy: def?.anatomy ?? spec.anatomies[0]!,
      feature: m.featureId,
      source: options.source,
      timestamp: options.timestamp,
      laterality: options.laterality ?? null,
      classificationContext: [spec.engineId],
      definitionVersion: def?.definitionVersion ?? null,
    };
  };

  for (const m of spec.mappings) {
    const raw = input[m.key];
    if (raw === undefined) continue;
    if (raw === null || (Array.isArray(raw) && raw.length === 0)) {
      lossy.push({
        code: "lossy_field",
        message: `${m.key}=${JSON.stringify(raw)} is treated as not provided (not a clinical negative)`,
        engineKey: m.key,
        featureId: m.featureId,
      });
      continue;
    }

    if (m.notAssessedEngineValue !== undefined && raw === m.notAssessedEngineValue) {
      observations.push({ ...base(m), value: null, status: "not_assessed" });
      continue;
    }
    if (m.notApplicableEngineValue !== undefined && raw === m.notApplicableEngineValue) {
      observations.push({ ...base(m), value: null, status: "not_applicable" });
      continue;
    }

    let value: MorphologyValue | null = null;
    let measurement: number | null = null;
    const def = registry.get(m.featureId);

    if (m.kind === "quantity" && typeof raw === "number") measurement = raw;
    else if (m.kind === "boolean" && typeof raw === "boolean") value = { kind: "boolean", present: raw };
    else if (m.kind === "text" && typeof raw === "string") value = { kind: "text", text: raw };
    else if (m.kind === "enum" && typeof raw === "string") {
      const code = reverseEnum(m, raw);
      if (code) value = { kind: "enum", code };
    } else if (m.kind === "enum_set" && Array.isArray(raw)) {
      const codes = raw.map((r) => (typeof r === "string" ? reverseEnum(m, r) : undefined));
      if (codes.every((c): c is string => Boolean(c))) value = { kind: "enum_set", codes };
    }

    if (value == null && measurement == null) {
      lossy.push({
        code: "unsupported_value",
        message: `${m.key}=${JSON.stringify(raw)} has no canonical representation`,
        engineKey: m.key,
        featureId: m.featureId,
      });
      continue;
    }

    observations.push({
      ...base(m),
      value,
      measurement,
      unit: m.kind === "quantity" ? (def?.unit ?? null) : null,
      status,
      confirmation: status === "confirmed" ? (options.confirmation ?? null) : null,
    });
  }

  const known = new Set([...spec.mappings.map((m) => m.key), ...ignoredKeys]);
  for (const [key, raw] of Object.entries(input)) {
    if (raw === undefined || known.has(key)) continue;
    lossy.push({
      code: "lossy_field",
      message: `${key} is not represented in canonical morphology`,
      engineKey: key,
    });
  }

  return { observations, lossy };
}
