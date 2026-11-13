import type { MusaAdenomyosisAssessmentInput } from "@repo/musa-framework";

import type { MorphologyObservation } from "../types";
import {
  buildEngineFields,
  buildObservationsFromFields,
  finalizeEngineInput,
  type AdapterSpec,
} from "./mapping";
import type { FromEngineOptions, FromEngineResult, ToEngineOptions, ToEngineResult } from "./types";

/** MUSA adenomyosis (`calculateAdenomyosisScore` / `generateAdenomyosisReport`). */
export const MUSA_ADENOMYOSIS_SPEC: AdapterSpec = {
  engineId: "musa_adenomyosis",
  anatomies: ["uterus"],
  required: [
    "uterus.myometrial_cysts",
    "uterus.hyperechogenic_islands",
    "uterus.subendometrial_lines_buds",
    "uterus.heterogeneous_myometrium",
    "uterus.wall_asymmetry",
    "uterus.globular_shape",
    "uterus.fan_shaped_shadowing",
  ],
  mappings: [
    { featureId: "uterus.myometrial_cysts", key: "myometrialCysts", kind: "boolean" },
    { featureId: "uterus.hyperechogenic_islands", key: "hyperechogenicIslands", kind: "boolean" },
    { featureId: "uterus.subendometrial_lines_buds", key: "subendometrialStriations", kind: "boolean" },
    { featureId: "uterus.heterogeneous_myometrium", key: "heterogeneousMyometrium", kind: "boolean" },
    { featureId: "uterus.wall_asymmetry", key: "asymmetry", kind: "boolean" },
    { featureId: "uterus.globular_shape", key: "globularUterus", kind: "boolean" },
    { featureId: "uterus.fan_shaped_shadowing", key: "fanShapedShadowing", kind: "boolean" },
    { featureId: "uterus.jz_thickness_max", key: "jzThicknessMm", kind: "quantity" },
    { featureId: "uterus.adenomyosis_localization", key: "localization", kind: "enum_set" },
    { featureId: "uterus.adenomyosis_depth", key: "depthOfInvasion", kind: "enum" },
    { featureId: "uterus.adenomyosis_morphotype", key: "morphologicType", kind: "enum" },
    { featureId: "uterus.jz_irregularity", key: "jzIrregularity", kind: "enum" },
    { featureId: "uterus.serosal_contour", key: "uterineContour", kind: "enum" },
    { featureId: "uterus.anterior_wall_thickness", key: "anteriorWallMm", kind: "quantity" },
    { featureId: "uterus.posterior_wall_thickness", key: "posteriorWallMm", kind: "quantity" },
  ],
};

/**
 * Required booleans are never defaulted to `false`: a not_assessed feature blocks the score.
 * JZ without a measurement makes the engine count the "JZ > 12 mm" item as 0 points,
 * so it blocks unless `allowPartial: true` (then `completeness: "partial"`).
 */
export function toMusaAdenomyosisInput(
  observations: readonly MorphologyObservation[],
  options: ToEngineOptions = {},
): ToEngineResult<MusaAdenomyosisAssessmentInput> {
  const built = buildEngineFields(observations, MUSA_ADENOMYOSIS_SPEC, options);
  const incomplete = built.fields.jzThicknessMm === undefined ? ["uterus.jz_thickness_max"] : [];

  return finalizeEngineInput(
    "musa_adenomyosis",
    built,
    {
      input: built.fields as MusaAdenomyosisAssessmentInput,
      missing: built.missing,
      errors: built.errors,
      warnings: built.warnings,
      incomplete,
    },
    options,
  );
}

export function fromMusaAdenomyosisInput(
  input: MusaAdenomyosisAssessmentInput,
  options: FromEngineOptions,
): FromEngineResult {
  const { observations, lossy } = buildObservationsFromFields(
    input as unknown as Record<string, unknown>,
    MUSA_ADENOMYOSIS_SPEC,
    options,
  );
  return { observations, lossy, context: undefined };
}
