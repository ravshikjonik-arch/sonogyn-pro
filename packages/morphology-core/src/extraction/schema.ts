import type { AnatomicalSite, ClinicalAssertion, ModelExtractionPayload, ModelMention, ModelSubject } from "./types";

export const ANATOMICAL_SITES: readonly AnatomicalSite[] = [
  "ovary",
  "fallopian_tube",
  "adnexa",
  "pelvis",
  "uterus",
  "myometrium",
  "endometrium",
  "cervix",
  "breast",
  "thyroid",
  "neck_lymph_node",
  "other",
];

const ASSERTIONS: readonly ClinicalAssertion[] = ["affirmed", "negated", "suspected", "uncertain", "not_assessed"];
/** Accepted model spelling from prompt v1; normalized to `uncertain`. */
const ASSERTION_ALIASES: Record<string, ClinicalAssertion> = { hedged: "uncertain" };
const SUBJECT_LATERALITY = ["left", "right", "bilateral"] as const;

const SUBJECT_KEYS = new Set(["ref", "site", "laterality", "lateralityText", "sourceText"]);
const MENTION_KEYS = new Set([
  "subjectRef",
  "featureId",
  "site",
  "assertion",
  "valueCode",
  "valueCodes",
  "present",
  "text",
  "measurementText",
  "sourceText",
  "extractionConfidence",
  "note",
]);

/** JSON Schema of the model payload (documentation + optional provider structured output). */
export const MODEL_PAYLOAD_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["subjects", "mentions"],
  properties: {
    subjects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ref", "site", "laterality", "lateralityText", "sourceText"],
        properties: {
          ref: { type: "string", minLength: 1 },
          site: { enum: ANATOMICAL_SITES },
          laterality: { enum: [...SUBJECT_LATERALITY, null] },
          lateralityText: { type: ["string", "null"] },
          sourceText: { type: ["string", "null"] },
        },
      },
    },
    mentions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [...MENTION_KEYS],
        properties: {
          subjectRef: { type: ["string", "null"] },
          featureId: { type: ["string", "null"] },
          site: { enum: [...ANATOMICAL_SITES, null] },
          assertion: { enum: ASSERTIONS },
          valueCode: { type: ["string", "null"] },
          valueCodes: { type: ["array", "null"], items: { type: "string" } },
          present: { type: ["boolean", "null"] },
          text: { type: ["string", "null"] },
          measurementText: { type: ["string", "null"] },
          sourceText: { type: "string", minLength: 1 },
          extractionConfidence: { type: "number", minimum: 0, maximum: 1 },
          note: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

export type RejectedMention = { raw: unknown; sourceText: string; detail: string };

export type ParsePayloadResult =
  | { ok: true; payload: ModelExtractionPayload; rejected: RejectedMention[]; issues: string[] }
  | { ok: false; issues: string[] };

const isObj = (x: unknown): x is Record<string, unknown> => Boolean(x) && typeof x === "object" && !Array.isArray(x);
const strOrNull = (x: unknown) => x === null || typeof x === "string";

/** Extracts the first JSON object from model output (tolerates a ```json fence, nothing else). */
export function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1]! : trimmed);
}

function checkSubject(x: unknown): ModelSubject | string {
  if (!isObj(x)) return "subject is not an object";
  const extra = Object.keys(x).filter((k) => !SUBJECT_KEYS.has(k));
  if (extra.length) return `subject has unexpected keys: ${extra.join(", ")}`;
  if (typeof x.ref !== "string" || !x.ref) return "subject.ref must be a non-empty string";
  if (!ANATOMICAL_SITES.includes(x.site as AnatomicalSite)) return `subject.site invalid: ${String(x.site)}`;
  if (x.laterality !== null && !SUBJECT_LATERALITY.includes(x.laterality as never)) {
    return `subject.laterality invalid: ${String(x.laterality)}`;
  }
  if (!strOrNull(x.lateralityText) || !strOrNull(x.sourceText)) return "subject text fields must be string|null";
  return x as unknown as ModelSubject;
}

function checkMention(x: unknown): ModelMention | string {
  if (!isObj(x)) return "mention is not an object";
  const extra = Object.keys(x).filter((k) => !MENTION_KEYS.has(k));
  if (extra.length) return `mention has unexpected keys: ${extra.join(", ")}`;
  const missing = [...MENTION_KEYS].filter((k) => !(k in x));
  if (missing.length) return `mention is missing keys: ${missing.join(", ")}`;
  if (typeof x.sourceText !== "string" || !x.sourceText.trim()) return "mention.sourceText must be non-empty";
  const assertion = ASSERTION_ALIASES[String(x.assertion)] ?? x.assertion;
  if (!ASSERTIONS.includes(assertion as ClinicalAssertion)) return `mention.assertion invalid: ${String(x.assertion)}`;
  if (x.site !== null && !ANATOMICAL_SITES.includes(x.site as AnatomicalSite)) return `mention.site invalid: ${String(x.site)}`;
  for (const k of ["subjectRef", "featureId", "valueCode", "text", "measurementText", "note"] as const) {
    if (!strOrNull(x[k])) return `mention.${k} must be string|null`;
  }
  if (x.present !== null && typeof x.present !== "boolean") return "mention.present must be boolean|null";
  if (x.valueCodes !== null && !(Array.isArray(x.valueCodes) && x.valueCodes.every((c) => typeof c === "string"))) {
    return "mention.valueCodes must be string[]|null";
  }
  const c = x.extractionConfidence;
  if (typeof c !== "number" || !Number.isFinite(c) || c < 0 || c > 1) {
    return "mention.extractionConfidence must be a number in [0,1]";
  }
  return { ...(x as unknown as ModelMention), assertion: assertion as ClinicalAssertion };
}

/**
 * Strict structural validation. A malformed envelope invalidates the whole response;
 * a malformed mention is rejected individually and preserved for `unresolvedMentions`.
 */
export function parseModelPayload(content: string): ParsePayloadResult {
  let raw: unknown;
  try {
    raw = extractJsonObject(content);
  } catch {
    return { ok: false, issues: ["model output is not valid JSON"] };
  }
  if (!isObj(raw)) return { ok: false, issues: ["model output is not a JSON object"] };
  if (!Array.isArray(raw.subjects) || !Array.isArray(raw.mentions)) {
    return { ok: false, issues: ["model output must contain arrays `subjects` and `mentions`"] };
  }

  const issues: string[] = [];
  const extraTop = Object.keys(raw).filter((k) => k !== "subjects" && k !== "mentions");
  if (extraTop.length) issues.push(`ignored unexpected top-level keys: ${extraTop.join(", ")}`);

  const subjects: ModelSubject[] = [];
  const refs = new Set<string>();
  for (const s of raw.subjects) {
    const checked = checkSubject(s);
    if (typeof checked === "string") return { ok: false, issues: [...issues, checked] };
    if (refs.has(checked.ref)) return { ok: false, issues: [...issues, `duplicate subject ref ${checked.ref}`] };
    refs.add(checked.ref);
    subjects.push(checked);
  }

  const mentions: ModelMention[] = [];
  const rejected: RejectedMention[] = [];
  for (const m of raw.mentions) {
    const checked = checkMention(m);
    if (typeof checked === "string") {
      const sourceText = isObj(m) && typeof m.sourceText === "string" ? m.sourceText : "";
      rejected.push({ raw: m, sourceText, detail: checked });
    } else {
      mentions.push(checked);
    }
  }

  return { ok: true, payload: { subjects, mentions }, rejected, issues };
}
