import { BIRADS_US_SPEC } from "../adapters/birads-us";
import { MUSA_ADENOMYOSIS_SPEC } from "../adapters/musa-adenomyosis";
import { ORADS_DIMENSION_FEATURES, ORADS_MUST_STATE_FEATURES } from "../adapters/orads-us";
import { TIRADS_ACR_SPEC } from "../adapters/tirads-acr";
import { defaultFeatureRegistry } from "../features";
import { validateObservation } from "../observation";
import type { FeatureRegistry } from "../registry";
import type {
  ClassificationContextId,
  Laterality,
  MeasurementUnit,
  MorphologyAnatomy,
  MorphologyFeatureDefinition,
  MorphologyObservation,
  MorphologyStatus,
  MorphologyValue,
} from "../types";
import { LATERAL_ANATOMIES, SITE_TO_ANATOMY, siteAllowsAnatomy } from "./anatomy";
import type { RejectedMention } from "./schema";
import { CONCEPT_CUES, hasNegationCue, hasNotAssessedCue, hedgeCue, lateralityCues, locateFragment } from "./text";
import type {
  AnatomicalSite,
  ClinicalAssertion,
  ExtractionAmbiguity,
  ExtractionSubject,
  MissingInformationItem,
  ModelExtractionPayload,
  ModelMention,
  ObservationEvidence,
  TextFragment,
  UnresolvedMention,
  UnresolvedReason,
} from "./types";
import { parseMeasurement } from "./units";

/** Enum codes that encode "absent". A negative value always needs a negation cue in the fragment. */
const NEGATIVE_ENUM_CODES: Record<string, readonly string[]> = {
  "adnexa.papillary_projection_count": ["0"],
  "adnexa.septa_count": ["0"],
  "adnexa.blood_flow": ["none"],
  "adnexa.iota_color_score": ["1"],
  "breast_us.vascularity": ["none"],
  "breast_us.posterior_features": ["none"],
  "breast_us.non_mass_associated_features": ["none"],
};

/** Reasons that indicate the model broke an extraction rule (vs. a legitimately unknown term). */
export const VIOLATION_REASONS: ReadonlySet<UnresolvedReason> = new Set<UnresolvedReason>([
  "schema_violation",
  "source_not_found_in_text",
  "negation_without_cue",
  "inconsistent_negation",
  "anatomy_mismatch",
  "value_not_allowed",
  "unknown_subject",
  "not_assessed_without_cue",
  "inconsistent_not_assessed",
  "concept_mismatch",
  "validation_failed",
]);

/** Statuses the extraction layer may emit. Never `confirmed` / `not_applicable`. */
export const EXTRACTION_STATUSES: ReadonlySet<MorphologyStatus> = new Set<MorphologyStatus>([
  "suggested",
  "uncertain",
  "not_assessed",
  "contradicted",
]);

type Candidate = {
  subjectRef: string | null;
  def: MorphologyFeatureDefinition;
  /** null for not_assessed statements. */
  value: MorphologyValue | null;
  measurement: number | null;
  unit: MeasurementUnit | null;
  assertion: ClinicalAssertion;
  confidence: number;
  fragment: TextFragment;
  normalizedFrom?: string;
  measurementText?: string;
};

type BuiltValue =
  | {
      ok: true;
      value: MorphologyValue | null;
      measurement: number | null;
      unit: MeasurementUnit | null;
      normalizedFrom?: string;
      measurementText?: string;
    }
  | { ok: false; reason: UnresolvedReason; detail: string };

function matchCode(def: MorphologyFeatureDefinition, raw: string): { code: string; normalizedFrom?: string } | null {
  const allowed = def.allowedValues ?? [];
  const exact = allowed.find((v) => v.code === raw);
  if (exact) return { code: exact.code };
  const needle = raw.trim().toLowerCase().replace(/ё/g, "е");
  const loose = allowed.find((v) =>
    [v.code, v.label, ...(v.synonyms ?? [])].some((s) => s.toLowerCase().replace(/ё/g, "е") === needle),
  );
  return loose ? { code: loose.code, normalizedFrom: raw } : null;
}

function hasModelValue(m: ModelMention): boolean {
  return (
    m.valueCode !== null ||
    (m.valueCodes !== null && m.valueCodes.length > 0) ||
    m.present !== null ||
    (m.text !== null && m.text.trim() !== "") ||
    m.measurementText !== null
  );
}

function buildValue(def: MorphologyFeatureDefinition, m: ModelMention, sourceText: string): BuiltValue {
  switch (def.valueType) {
    case "boolean":
      if (m.present === null) return { ok: false, reason: "value_missing", detail: "boolean feature without `present`" };
      return { ok: true, value: { kind: "boolean", present: m.present }, measurement: null, unit: null };
    case "text":
      if (!m.text?.trim()) return { ok: false, reason: "value_missing", detail: "text feature without `text`" };
      return { ok: true, value: { kind: "text", text: m.text.trim() }, measurement: null, unit: null };
    case "enum": {
      if (!m.valueCode) return { ok: false, reason: "value_missing", detail: "enum feature without `valueCode`" };
      const hit = matchCode(def, m.valueCode);
      if (!hit) return { ok: false, reason: "value_not_allowed", detail: `"${m.valueCode}" is not a code of ${def.featureId}` };
      return { ok: true, value: { kind: "enum", code: hit.code }, measurement: null, unit: null, normalizedFrom: hit.normalizedFrom };
    }
    case "enum_set": {
      if (!m.valueCodes?.length) return { ok: false, reason: "value_missing", detail: "enum_set feature without `valueCodes`" };
      const codes: string[] = [];
      for (const c of m.valueCodes) {
        const hit = matchCode(def, c);
        if (!hit) return { ok: false, reason: "value_not_allowed", detail: `"${c}" is not a code of ${def.featureId}` };
        codes.push(hit.code);
      }
      return { ok: true, value: { kind: "enum_set", codes: [...new Set(codes)] }, measurement: null, unit: null };
    }
    case "quantity": {
      if (!m.measurementText) return { ok: false, reason: "value_missing", detail: "quantity feature without `measurementText`" };
      if (!locateFragment(sourceText, m.measurementText)) {
        return { ok: false, reason: "source_not_found_in_text", detail: `measurement "${m.measurementText}" is not inside the fragment` };
      }
      const parsed = parseMeasurement(m.measurementText, def.unit!, sourceText);
      if (!parsed.ok) return { ok: false, reason: "unit_unparsed", detail: parsed.reason };
      return { ok: true, value: null, measurement: parsed.value, unit: parsed.unit, measurementText: m.measurementText };
    }
  }
}

function isNegative(def: MorphologyFeatureDefinition, value: MorphologyValue | null): boolean {
  if (!value) return false;
  if (value.kind === "boolean") return value.present === false;
  if (value.kind === "enum") return (NEGATIVE_ENUM_CODES[def.featureId] ?? []).includes(value.code);
  return false;
}

/** Value as it appears in `alternatives` of a contradicted observation. */
function asAlternative(c: Candidate): MorphologyValue {
  if (c.assertion === "not_assessed") return { kind: "not_assessed" };
  if (c.measurement != null) return { kind: "quantity", value: c.measurement, unit: c.unit! };
  return c.value!;
}

const CLARIFY: Partial<
  Record<MorphologyAnatomy, { all: readonly string[]; anyOf?: readonly (readonly string[])[]; for: ClassificationContextId }>
> = {
  adnexa: {
    all: ["adnexa.lesion_kind", "adnexa.structure", ...ORADS_MUST_STATE_FEATURES.filter((f) => f.startsWith("adnexa."))],
    anyOf: [ORADS_DIMENSION_FEATURES],
    for: "orads_us_pro",
  },
  uterus: { all: [...MUSA_ADENOMYOSIS_SPEC.required, "uterus.jz_thickness_max"], for: "musa_adenomyosis" },
  breast: { all: BIRADS_US_SPEC.required, for: "birads_us" },
  thyroid: { all: [...TIRADS_ACR_SPEC.required, "thyroid.nodule_largest_diameter"], for: "tirads_acr" },
};
const PELVIS_GLOBAL = ORADS_MUST_STATE_FEATURES.filter((f) => f.startsWith("pelvis."));

export type AssembleContext = {
  text: string;
  extractionId: string;
  timestamp: string;
  registry?: FeatureRegistry;
};

export type AssembledExtraction = {
  observations: MorphologyObservation[];
  evidence: ObservationEvidence[];
  subjects: ExtractionSubject[];
  unresolvedMentions: UnresolvedMention[];
  ambiguities: ExtractionAmbiguity[];
  missingInformation: MissingInformationItem[];
};

/**
 * Deterministic acceptance of an untrusted model payload. Never assigns `confirmed`,
 * never creates a finding without a verbatim fragment, never picks a side of a contradiction.
 */
export function assembleExtraction(
  payload: ModelExtractionPayload,
  rejected: readonly RejectedMention[],
  ctx: AssembleContext,
): AssembledExtraction {
  const registry = ctx.registry ?? defaultFeatureRegistry;
  const unresolved: UnresolvedMention[] = [];
  const ambiguities: ExtractionAmbiguity[] = [];

  for (const r of rejected) {
    unresolved.push({ text: r.sourceText, reason: "schema_violation", detail: r.detail });
  }

  // --- subjects -----------------------------------------------------------
  const subjects = new Map<string, ExtractionSubject>();
  const lateralityEvidence = new Map<string, string>();
  for (const s of payload.subjects) {
    let laterality: Laterality | null = null;
    if (s.laterality) {
      const located = s.lateralityText ? locateFragment(ctx.text, s.lateralityText) : null;
      const cues = located ? lateralityCues(located.text) : new Set<string>();
      if (located && cues.has("left") && cues.has("right") && !cues.has("bilateral")) {
        ambiguities.push({
          kind: "laterality_conflict",
          subjectRef: s.ref,
          detail: "The laterality phrase names both left and right — side left unset",
          fragments: [located.text],
        });
      } else if (located && cues.has(s.laterality)) {
        laterality = s.laterality;
        lateralityEvidence.set(s.ref, located.text);
      } else {
        ambiguities.push({
          kind: "laterality_unverified",
          subjectRef: s.ref,
          detail: `Model laterality "${s.laterality}" is not supported by a side word in the text — left unset`,
          fragments: s.lateralityText ? [s.lateralityText] : undefined,
        });
      }
    }
    subjects.set(s.ref, { ref: s.ref, subjectId: `${ctx.extractionId}:${s.ref}`, site: s.site, laterality });
  }

  const ensureImplicitSubject = (site: AnatomicalSite): ExtractionSubject => {
    const ref = `auto-${site}`;
    const existing = subjects.get(ref);
    if (existing) return existing;
    const created: ExtractionSubject = { ref, subjectId: `${ctx.extractionId}:${ref}`, site, laterality: null };
    subjects.set(ref, created);
    return created;
  };

  // --- mentions → candidates ---------------------------------------------
  const candidates: Candidate[] = [];
  const reject = (m: ModelMention, reason: UnresolvedReason, detail: string) =>
    unresolved.push({
      text: m.sourceText,
      reason,
      detail,
      proposedFeatureId: m.featureId,
      site: m.site,
      subjectRef: m.subjectRef,
    });

  for (const m of payload.mentions) {
    const fragment = locateFragment(ctx.text, m.sourceText);
    if (!fragment) {
      reject(m, "source_not_found_in_text", "quoted fragment does not occur in the input text");
      continue;
    }
    if (m.featureId === null) {
      reject(m, "model_unmapped", m.note?.trim() || "model reported no matching feature");
      continue;
    }
    const def = registry.get(m.featureId);
    if (!def) {
      reject(m, "unknown_feature", `featureId "${m.featureId}" is not in the registry`);
      continue;
    }

    let subject: ExtractionSubject | null = null;
    if (m.subjectRef !== null) {
      subject = subjects.get(m.subjectRef) ?? null;
      if (!subject) {
        reject(m, "unknown_subject", `subjectRef "${m.subjectRef}" was not declared`);
        continue;
      }
    } else if (def.anatomy !== "pelvis") {
      const declared = [...subjects.values()].filter((s) => !s.ref.startsWith("auto-"));
      if (declared.length === 1) subject = declared[0]!;
      else if (declared.length === 0 && m.site) subject = ensureImplicitSubject(m.site);
      else {
        reject(m, "unknown_subject", "mention has no subjectRef and the text has several subjects");
        continue;
      }
    }

    const site = m.site ?? subject?.site ?? null;
    if (!site || !siteAllowsAnatomy(site, def.anatomy)) {
      const allowed = site ? SITE_TO_ANATOMY[site] : [];
      reject(
        m,
        "anatomy_mismatch",
        `${def.featureId} belongs to ${def.anatomy}; text site is ${site ?? "unknown"}${
          allowed.length ? "" : " (no registered features for this site)"
        }`,
      );
      continue;
    }

    // Papillary projection, solid component, mural / wall component are different concepts:
    // a feature may be used only when its own concept is named in the fragment.
    const concept = CONCEPT_CUES[def.featureId];
    if (concept && !concept.pattern.test(fragment.text)) {
      reject(m, "concept_mismatch", `${def.featureId} requires the fragment to name ${concept.concept}; not inferred from a related term`);
      continue;
    }

    // --- explicit "not assessed" ------------------------------------------
    const notAssessedCue = hasNotAssessedCue(fragment.text);
    let assertion: ClinicalAssertion = m.assertion;

    if (assertion === "not_assessed" || (notAssessedCue && assertion === "negated")) {
      if (!notAssessedCue) {
        reject(m, "not_assessed_without_cue", "not_assessed requires an explicit phrase such as «не оценивался» / «оценить невозможно»");
        continue;
      }
      if (assertion === "negated") {
        ambiguities.push({
          kind: "not_assessed_statement",
          featureId: def.featureId,
          subjectRef: subject?.ref,
          detail: "Model read a «not assessed» phrase as a negative finding — kept as not_assessed, the negative value was discarded",
          fragments: [fragment.text],
        });
      } else if (hasModelValue(m)) {
        reject(m, "inconsistent_not_assessed", "not_assessed mention must not carry a value");
        continue;
      }
      candidates.push({
        subjectRef: subject?.ref ?? null,
        def,
        value: null,
        measurement: null,
        unit: null,
        assertion: "not_assessed",
        confidence: m.extractionConfidence,
        fragment,
      });
      continue;
    }
    if (notAssessedCue) {
      reject(m, "inconsistent_not_assessed", "fragment states the feature was not assessed but a value was extracted");
      continue;
    }

    const built = buildValue(def, m, fragment.text);
    if (!built.ok) {
      reject(m, built.reason, built.detail);
      continue;
    }

    const negative = isNegative(def, built.value);
    const negationCue = hasNegationCue(fragment.text);

    if (assertion === "negated") {
      if (!negationCue) {
        reject(m, "negation_without_cue", "negated mention without a negation word in the fragment");
        continue;
      }
      if (!negative) {
        const reason: UnresolvedReason =
          built.value?.kind === "boolean" ? "inconsistent_negation" : "negation_not_representable";
        reject(m, reason, `negation cannot be expressed as a negative value of ${def.featureId}`);
        continue;
      }
    } else if (negative && !negationCue) {
      reject(m, "negation_without_cue", "negative value without an explicit negation in the text");
      continue;
    }

    const cue = hedgeCue(fragment.text);
    if (cue && (assertion === "affirmed" || assertion === "negated")) {
      ambiguities.push({
        kind: "hedged_statement",
        featureId: def.featureId,
        subjectRef: subject?.ref,
        detail: `Model marked the statement as certain, but the fragment is ${cue} — kept as uncertain`,
        fragments: [fragment.text],
      });
      assertion = cue;
    } else if (assertion === "suspected" || assertion === "uncertain") {
      ambiguities.push({
        kind: "hedged_statement",
        featureId: def.featureId,
        subjectRef: subject?.ref,
        detail: `${assertion === "suspected" ? "Suspected" : "Uncertain"} statement — needs physician confirmation`,
        fragments: [fragment.text],
      });
    }

    if (built.measurement != null && def.unit === "mm" && (built.measurement < 0.5 || built.measurement > 300)) {
      ambiguities.push({
        kind: "implausible_measurement",
        featureId: def.featureId,
        subjectRef: subject?.ref,
        detail: `${built.measurement} mm is outside the expected range — check the unit`,
        fragments: [built.measurementText ?? fragment.text],
      });
    }

    candidates.push({
      subjectRef: subject?.ref ?? null,
      def,
      value: built.value,
      measurement: built.measurement,
      unit: built.unit,
      assertion,
      confidence: m.extractionConfidence,
      fragment,
      normalizedFrom: built.normalizedFrom,
      measurementText: built.measurementText,
    });
  }

  // --- laterality conflicts between subject and its fragments -------------
  for (const s of subjects.values()) {
    const fragments = candidates
      .filter((c) => c.subjectRef === s.ref && LATERAL_ANATOMIES.includes(c.def.anatomy))
      .map((c) => c.fragment.text);
    const named = new Set<string>();
    for (const f of [...fragments, lateralityEvidence.get(s.ref) ?? ""]) {
      for (const cue of lateralityCues(f)) if (cue !== "bilateral") named.add(cue);
    }
    const opposite = s.laterality === "left" ? "right" : s.laterality === "right" ? "left" : null;
    if ((named.has("left") && named.has("right")) || (opposite && named.has(opposite))) {
      ambiguities.push({
        kind: "laterality_conflict",
        subjectRef: s.ref,
        detail: `Fragments of one finding name ${[...named].join(" and ")} — side not set, physician must resolve`,
        fragments: [lateralityEvidence.get(s.ref), ...fragments].filter((f): f is string => Boolean(f)),
      });
      s.laterality = null;
    }
  }

  // --- group per (subject, feature) ---------------------------------------
  const groups = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const key = `${c.subjectRef ?? "_"}|${c.def.featureId}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  const observations: MorphologyObservation[] = [];
  const evidence: ObservationEvidence[] = [];

  for (const group of groups.values()) {
    const first = group[0]!;
    const def = first.def;
    const subject = first.subjectRef ? subjects.get(first.subjectRef)! : null;
    const signature = (c: Candidate) => JSON.stringify(asAlternative(c));
    const distinct = [...new Map(group.map((c) => [signature(c), c])).values()];
    const id = `${ctx.extractionId}:${first.subjectRef ?? "global"}:${def.featureId}`;
    const laterality = subject && LATERAL_ANATOMIES.includes(def.anatomy) ? subject.laterality : null;
    const fragments = group.map((c) => c.fragment);
    const base = {
      id,
      subjectId: subject?.subjectId ?? null,
      anatomy: def.anatomy,
      feature: def.featureId,
      source: "ai_text_extraction" as const,
      confidence: { score: Math.min(...group.map((c) => c.confidence)), method: "model_self_report" as const },
      laterality,
      timestamp: ctx.timestamp,
      classificationContext: def.applicableClassifications,
      definitionVersion: def.definitionVersion,
      rawText: fragments.map((f) => f.text).join(" | "),
    };

    if (distinct.length > 1) {
      ambiguities.push({
        kind: "conflicting_values",
        featureId: def.featureId,
        subjectRef: first.subjectRef ?? undefined,
        detail: `${distinct.length} different statements for ${def.featureId} — kept as contradicted, no value chosen`,
        fragments: fragments.map((f) => f.text),
      });
      observations.push({
        ...base,
        value: null,
        status: "contradicted",
        alternatives: distinct.map(asAlternative),
      });
    } else if (first.assertion === "not_assessed") {
      observations.push({ ...base, value: null, status: "not_assessed" });
    } else {
      const hedged = group.some((c) => c.assertion === "suspected" || c.assertion === "uncertain");
      observations.push({
        ...base,
        value: first.value,
        measurement: first.measurement,
        unit: first.unit,
        status: hedged ? "uncertain" : "suggested",
      });
    }
    evidence.push({
      observationId: id,
      fragments,
      assertions: group.map((c) => c.assertion),
      ...(first.normalizedFrom ? { normalizedFrom: first.normalizedFrom } : {}),
      ...(group.some((c) => c.measurementText)
        ? { measurementText: group.map((c) => c.measurementText).filter(Boolean).join(" | ") }
        : {}),
    });
  }

  // --- defence in depth: contract validation + invariants -----------------
  const accepted: MorphologyObservation[] = [];
  for (const o of observations) {
    const issues = validateObservation(o, registry);
    const forbidden = !EXTRACTION_STATUSES.has(o.status) || o.source !== "ai_text_extraction" || !o.rawText;
    if (issues.length || forbidden) {
      unresolved.push({
        text: o.rawText ?? "",
        reason: "validation_failed",
        detail: forbidden ? "extraction may emit only suggested/uncertain/not_assessed/contradicted AI observations with source text" : issues.map((i) => i.message).join("; "),
        proposedFeatureId: o.feature,
      });
      continue;
    }
    accepted.push(o);
  }
  const acceptedIds = new Set(accepted.map((o) => o.id));

  // --- missing information (never turned into observations) --------------
  const missing: MissingInformationItem[] = [];
  const state = (subjectId: string | null, featureId: string) => {
    const o = accepted.find((x) => x.feature === featureId && (subjectId === null || x.subjectId === subjectId));
    if (!o) return "absent" as const;
    if (o.status === "not_assessed") return "not_assessed" as const;
    return o.status === "uncertain" || o.status === "contradicted" ? ("unclear" as const) : ("present" as const);
  };
  const reasonFor = (st: "absent" | "not_assessed" | "unclear"): MissingInformationItem["reason"] =>
    st === "absent" ? "not_mentioned" : st === "not_assessed" ? "explicitly_not_assessed" : "needs_clarification";

  let hasAdnexa = false;
  for (const s of subjects.values()) {
    for (const anatomy of SITE_TO_ANATOMY[s.site]) {
      const cfg = CLARIFY[anatomy];
      if (!cfg) continue;
      if (anatomy === "adnexa") hasAdnexa = true;
      for (const f of cfg.all) {
        const st = state(s.subjectId, f);
        if (st !== "present") missing.push({ subjectRef: s.ref, featureId: f, reason: reasonFor(st), forClassification: cfg.for });
      }
      for (const group of cfg.anyOf ?? []) {
        if (group.every((f) => state(s.subjectId, f) === "absent")) {
          missing.push({ subjectRef: s.ref, featureId: group.join("|"), reason: "not_mentioned", forClassification: cfg.for });
        }
      }
    }
  }
  if (hasAdnexa) {
    for (const f of PELVIS_GLOBAL) {
      const st = state(null, f);
      if (st !== "present") missing.push({ subjectRef: null, featureId: f, reason: reasonFor(st), forClassification: "orads_us_pro" });
    }
    missing.push({ subjectRef: null, featureId: "context.menopause", reason: "clinical_context_required", forClassification: "orads_us_pro" });
  }

  return {
    observations: accepted,
    evidence: evidence.filter((e) => acceptedIds.has(e.observationId)),
    subjects: [...subjects.values()],
    unresolvedMentions: unresolved,
    ambiguities,
    missingInformation: missing,
  };
}
