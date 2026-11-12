import type { AssistantAnswer } from "@repo/evidence-retrieval/types";
import type { MorphologyObservation, MorphologyValue } from "@repo/morphology-core";
import { runMorphologyExtraction, type ExtractionGuards } from "@repo/morphology-core/extraction";

import type { EvidenceRunResult } from "../evidence";
import type { MiDependencies } from "../orchestrator";

export const T = "2026-11-06T11:00:00.000Z";

export const e = (code: string): MorphologyValue => ({ kind: "enum", code });
export const b = (present: boolean): MorphologyValue => ({ kind: "boolean", present });

let n = 0;
export function phys(
  feature: string,
  anatomy: MorphologyObservation["anatomy"],
  extra: Partial<MorphologyObservation> = {},
): MorphologyObservation {
  n += 1;
  return {
    id: `p${n}:${feature}`,
    anatomy,
    feature,
    value: null,
    status: "confirmed",
    source: "physician_input",
    timestamp: T,
    ...extra,
  };
}

/** O-RADS: every hard requirement and must-state feature explicitly stated by the physician. */
export const oradsLesion = () => [
  phys("adnexa.localization", "adnexa", { value: e("ovarian"), laterality: "left" }),
  phys("adnexa.lesion_kind", "adnexa", { value: e("nonphysiological"), laterality: "left" }),
  phys("adnexa.structure", "adnexa", { value: e("unilocular"), laterality: "left" }),
  phys("adnexa.lesion_length", "adnexa", { measurement: 45, unit: "mm", laterality: "left" }),
  phys("adnexa.lesion_width", "adnexa", { measurement: 36, unit: "mm", laterality: "left" }),
  phys("adnexa.lesion_height", "adnexa", { measurement: 31.5, unit: "mm", laterality: "left" }),
  phys("adnexa.cyst_content_echogenicity", "adnexa", { value: e("anechoic"), laterality: "left" }),
  phys("adnexa.solid_component", "adnexa", { value: b(true), laterality: "left" }),
  phys("adnexa.solid_component_contour", "adnexa", { value: e("papillary"), laterality: "left" }),
  phys("adnexa.papillary_projection_count", "adnexa", { value: e("4plus"), laterality: "left" }),
  phys("adnexa.acoustic_shadows", "adnexa", { value: b(false), laterality: "left" }),
  phys("adnexa.iota_color_score", "adnexa", { value: e("4"), laterality: "left" }),
  phys("pelvis.ascites", "pelvis", { value: b(true) }),
  phys("pelvis.peritoneal_nodules", "pelvis", { value: b(false) }),
];

export const biradsMass = () => [
  phys("breast_us.finding_type", "breast", { value: e("mass") }),
  phys("breast_us.mass_shape", "breast", { value: e("irregular") }),
  phys("breast_us.mass_orientation", "breast", { value: e("non_parallel") }),
  phys("breast_us.mass_margin", "breast", { value: e("spiculated") }),
  phys("breast_us.echo_pattern", "breast", { value: e("hypoechoic") }),
  phys("breast_us.posterior_features", "breast", { value: e("shadowing") }),
  phys("breast_us.vascularity", "breast", { value: e("marked") }),
];

export const tiradsNodule = () => [
  phys("thyroid.acr_composition", "thyroid", { value: e("solid") }),
  phys("thyroid.acr_echogenicity", "thyroid", { value: e("hypoechoic") }),
  phys("thyroid.acr_shape", "thyroid", { value: e("wider_than_tall") }),
  phys("thyroid.acr_margin", "thyroid", { value: e("smooth") }),
  phys("thyroid.acr_echogenic_foci", "thyroid", { value: { kind: "enum_set", codes: ["none_or_comet_tail"] } }),
  phys("thyroid.nodule_largest_diameter", "thyroid", { measurement: 22, unit: "mm" }),
];

export const musaUterus = () => [
  ...[
    "uterus.myometrial_cysts",
    "uterus.hyperechogenic_islands",
    "uterus.subendometrial_lines_buds",
    "uterus.heterogeneous_myometrium",
    "uterus.wall_asymmetry",
    "uterus.globular_shape",
    "uterus.fan_shaped_shadowing",
  ].map((f, i) => phys(f, "uterus", { value: b(i % 2 === 0) })),
  phys("uterus.jz_thickness_max", "uterus", { measurement: 13, unit: "mm" }),
];

export const OK_GUARDS: ExtractionGuards = {
  detectPhi: (t) => (/ФИО:/i.test(t) ? { ok: false, reasons: ["ФИО"] } : { ok: true, reasons: [] }),
  detectPromptInjection: (t) => (/ignore previous instructions/i.test(t) ? { ok: false, reasons: ["ignore"] } : { ok: true }),
};

export function citation(i: number) {
  return {
    id: `pubmed:${100000 + i}`,
    provider: "pubmed" as const,
    sourceId: String(100000 + i),
    recordType: "guideline" as const,
    title: `Guideline ${i}`,
    url: `https://pubmed.ncbi.nlm.nih.gov/${100000 + i}`,
    pmid: String(100000 + i),
    year: 2022,
    retrievedAt: T,
    relevanceScore: 0.9,
    quote: "Short provider quote",
    section: "Management",
  };
}

export function answer(citations: ReturnType<typeof citation>[], extra: Partial<AssistantAnswer> = {}): AssistantAnswer {
  return {
    query: "q",
    summary: "Summary from sources [1]",
    evidenceStrength: citations.length ? "moderate" : "insufficient",
    gradeLabel: citations.length ? "умеренно" : "недостаточно",
    recommendations: [],
    contraindications: [],
    alternatives: [],
    citations,
    guidelines: [],
    disclaimers: ["CDS"],
    sourcesUsed: { pubmed: "ok" },
    searchedAt: T,
    synthesisMode: "rules",
    insufficient: citations.length === 0,
    ...extra,
  };
}

/** Deterministic deps with call counters; extraction uses the real Phase B pipeline with a stub model. */
export function makeDeps(opts: {
  modelPayload?: unknown;
  modelError?: boolean;
  evidence?: EvidenceRunResult | (() => Promise<EvidenceRunResult>);
} = {}) {
  const calls = { extract: 0, model: 0, evidence: 0 };
  const deps: MiDependencies = {
    guards: OK_GUARDS,
    now: () => T,
    newRequestId: () => "req-test",
    extractText: async ({ text, requestId }) => {
      calls.extract += 1;
      return runMorphologyExtraction({
        text,
        guards: OK_GUARDS,
        now: () => T,
        extractionId: requestId,
        complete: async () => {
          calls.model += 1;
          return opts.modelError
            ? { ok: false, error: "all_providers_failed:openrouter" }
            : { ok: true, content: JSON.stringify(opts.modelPayload ?? { subjects: [], mentions: [] }), model: "stub-model", provider: "stub" };
        },
      });
    },
    retrieveEvidence: async () => {
      calls.evidence += 1;
      const ev = opts.evidence ?? { ok: true, answer: answer([citation(1)]), validation: { ok: true, text: "x [1]", reasons: [], replaced: false } };
      return typeof ev === "function" ? ev() : ev;
    },
  };
  return { deps, calls };
}
