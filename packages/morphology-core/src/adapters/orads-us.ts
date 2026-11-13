import type { OradsInput, OvarySide } from "@repo/orads-us/pro";

import type { MorphologyObservation } from "../types";
import {
  buildEngineFields,
  buildObservationsFromFields,
  finalizeEngineInput,
  hasAnyResolved,
  isExplicitlyStated,
  type AdapterSpec,
} from "./mapping";
import type {
  AdapterIssue,
  FromEngineOptions,
  FromEngineResult,
  ToEngineOptions,
  ToEngineResult,
} from "./types";

/** Clinical (non-morphologic) inputs O-RADS needs. Kept outside MorphologyObservation on purpose. */
export type OradsClinicalContext = Pick<OradsInput, "menopause" | "ageYears" | "cycleDay" | "iotaCenterType">;

const CONTEXT_KEYS = ["menopause", "ageYears", "cycleDay", "iotaCenterType"] as const;

export const ORADS_US_PRO_SPEC: AdapterSpec = {
  engineId: "orads_us_pro",
  anatomies: ["adnexa", "pelvis"],
  required: [],
  mappings: [
    { featureId: "adnexa.localization", key: "localization", kind: "enum" },
    { featureId: "adnexa.lesion_kind", key: "lesionKind", kind: "enum" },
    { featureId: "adnexa.physiological_type", key: "physiologicalType", kind: "enum" },
    { featureId: "adnexa.normal_ovary_pattern", key: "normalOvaryPattern", kind: "enum" },
    { featureId: "adnexa.structure", key: "structure", kind: "enum" },
    { featureId: "adnexa.unilocular_subtype", key: "unilocularSubtype", kind: "enum" },
    { featureId: "adnexa.septa_count", key: "septaCount", kind: "enum" },
    { featureId: "adnexa.septa_thickness", key: "septaThickness", kind: "enum" },
    { featureId: "adnexa.incomplete_septum", key: "incompleteSeptum", kind: "boolean" },
    { featureId: "adnexa.solid_component", key: "solidComponent", kind: "boolean" },
    { featureId: "adnexa.solid_component_contour", key: "solidType", kind: "enum" },
    {
      featureId: "adnexa.cyst_content_echogenicity",
      key: "echogenicity",
      kind: "enum",
      toEngine: { anechoic: "anechoic", hypoechoic: "hypo", isoechoic: "iso", hyperechoic: "hyper" },
    },
    { featureId: "adnexa.lesion_length", key: "lengthMm", kind: "quantity" },
    { featureId: "adnexa.lesion_width", key: "widthMm", kind: "quantity" },
    { featureId: "adnexa.lesion_height", key: "heightMm", kind: "quantity" },
    { featureId: "adnexa.blood_flow", key: "bloodFlow", kind: "enum" },
    { featureId: "adnexa.iota_lesion_type", key: "iotaLesionType", kind: "enum" },
    { featureId: "adnexa.papillary_projection_count", key: "papillaryProjectionCount", kind: "enum" },
    { featureId: "adnexa.papillary_projection_surface", key: "papillaryProjectionSurface", kind: "enum" },
    { featureId: "adnexa.largest_solid_component_diameter", key: "largestSolidDiameterMm", kind: "quantity" },
    { featureId: "adnexa.locules_over_10", key: "cystLoculesOver10", kind: "boolean" },
    { featureId: "adnexa.acoustic_shadows", key: "acousticShadows", kind: "boolean" },
    { featureId: "adnexa.iota_color_score", key: "iotaColorScore", kind: "enum" },
    { featureId: "pelvis.ascites", key: "ascites", kind: "boolean" },
    { featureId: "pelvis.peritoneal_nodules", key: "peritonealNodules", kind: "boolean" },
  ],
};

const DIMENSIONS = ["adnexa.lesion_length", "adnexa.lesion_width", "adnexa.lesion_height"];
export const ORADS_DIMENSION_FEATURES: readonly string[] = DIMENSIONS;
const CLASSIC_SUBTYPES = new Set(["dermoid", "endometrioma", "hemorrhagic", "paraovarian", "peritoneal_inclusion", "hydrosalpinx"]);

/**
 * Features that the existing `mapProInputToUs2022` silently defaults when absent
 * (solidComponent→false, solidType→smooth, papillae→"0", shadowing→false,
 * ascites/nodules→none, echogenicity→nonSimple, colour score→null).
 * Derived from reading the mapper — no engine logic is reimplemented here.
 */
const NONPHYSIOLOGICAL_MUST_STATE = [
  "adnexa.cyst_content_echogenicity",
  "adnexa.solid_component",
  "adnexa.solid_component_contour",
  "adnexa.papillary_projection_count",
  "adnexa.acoustic_shadows",
  "adnexa.iota_color_score",
  "pelvis.ascites",
  "pelvis.peritoneal_nodules",
];
export const ORADS_MUST_STATE_FEATURES: readonly string[] = NONPHYSIOLOGICAL_MUST_STATE;

const OVARY_SIDES: readonly OvarySide[] = ["left", "right", "bilateral"];

/**
 * Canonical observations (+ clinical context) → `OradsInput` for `calculateORADS`.
 * Never invents values: absent / not_assessed features stay undefined.
 *
 * Hard requirements (`missing`) are the inputs without which `calculateORADS` returns a
 * placeholder category 3 ("недостаточно данных") instead of a real assessment.
 * Must-state features (`incompleteFeatures`) are those the v2022 mapper would default;
 * they block unless `allowPartial: true`.
 */
export function toOradsProInput(
  observations: readonly MorphologyObservation[],
  context: OradsClinicalContext = {},
  options: ToEngineOptions = {},
): ToEngineResult<OradsInput> {
  const spec = ORADS_US_PRO_SPEC;
  const built = buildEngineFields(observations, spec, options);
  const warnings: AdapterIssue[] = [...built.warnings];
  const input: OradsInput = { ...(built.fields as OradsInput) };

  for (const key of CONTEXT_KEYS) {
    if (context[key] !== undefined) (input as Record<string, unknown>)[key] = context[key];
  }

  if (built.laterality) {
    if ((OVARY_SIDES as readonly string[]).includes(built.laterality)) {
      input.ovarySide = built.laterality as OvarySide;
    } else {
      warnings.push({
        code: "unsupported_transformation",
        message: `laterality "${built.laterality}" has no OradsInput.ovarySide equivalent`,
      });
    }
  }

  const missing = [...built.missing];
  const incomplete: string[] = [];
  const hasSize = hasAnyResolved(built, spec, DIMENSIONS);

  if (!input.menopause) missing.push("context.menopause");

  if (input.localization === "extraovarian") {
    if (!hasSize) missing.push("adnexa.lesion_length|width|height");
  } else if (!input.lesionKind) {
    missing.push("adnexa.lesion_kind");
  } else if (input.lesionKind === "physiological") {
    if (!hasSize) missing.push("adnexa.lesion_length|width|height");
  } else if (input.lesionKind === "nonphysiological") {
    const classic = input.unilocularSubtype ? CLASSIC_SUBTYPES.has(input.unilocularSubtype) : false;
    if (!input.structure && !classic) missing.push("adnexa.structure");
    if (!hasSize) missing.push("adnexa.lesion_length|width|height");
    for (const f of NONPHYSIOLOGICAL_MUST_STATE) {
      if (f === "adnexa.cyst_content_echogenicity" && input.unilocularSubtype === "simple_cyst") continue;
      if (!isExplicitlyStated(built, spec, f)) incomplete.push(f);
    }
  }

  const errors = [...built.errors];
  const papillaeStated =
    (input.papillaryProjectionCount !== undefined && input.papillaryProjectionCount !== "0") ||
    input.solidType === "papillary";
  if (input.solidComponent === false && papillaeStated) {
    // Not a reinterpretation of O-RADS: mapProInputToUs2022.resolvePapillae returns "0"
    // whenever solidComponent is false, so the stated papillae would be silently discarded.
    errors.push({
      code: "inconsistent_features",
      message:
        "Papillary projections stated while solid component = false: the existing O-RADS mapper would discard the papillae. Clarify solid component — it is not inferred automatically",
      featureId: "adnexa.solid_component",
    });
  }

  return finalizeEngineInput(
    "orads_us_pro",
    built,
    { input, missing, errors, warnings, incomplete },
    options,
  );
}

export function fromOradsProInput(
  input: OradsInput,
  options: FromEngineOptions,
): FromEngineResult<OradsClinicalContext> {
  const laterality = options.laterality ?? input.ovarySide;
  const { observations, lossy } = buildObservationsFromFields(
    input as Record<string, unknown>,
    ORADS_US_PRO_SPEC,
    { ...options, laterality },
    [...CONTEXT_KEYS, "ovarySide"],
  );
  const context: OradsClinicalContext = {};
  for (const key of CONTEXT_KEYS) {
    if (input[key] !== undefined) (context as Record<string, unknown>)[key] = input[key];
  }
  return { observations, lossy, context };
}
