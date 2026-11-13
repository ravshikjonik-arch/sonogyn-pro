import type { BiradsInput } from "@repo/birads-us";

import type { MorphologyObservation } from "../types";
import {
  buildEngineFields,
  buildObservationsFromFields,
  finalizeEngineInput,
  type AdapterSpec,
} from "./mapping";
import type { FromEngineOptions, FromEngineResult, ToEngineOptions, ToEngineResult } from "./types";

const MASS_DESCRIPTORS = [
  "breast_us.mass_shape",
  "breast_us.mass_orientation",
  "breast_us.mass_margin",
];

/** BI-RADS **US** (`@repo/birads-us` `evaluateBirads`). Mammography is out of scope by design. */
export const BIRADS_US_SPEC: AdapterSpec = {
  engineId: "birads_us",
  anatomies: ["breast"],
  required: [
    "breast_us.finding_type",
    "breast_us.mass_shape",
    "breast_us.mass_margin",
    "breast_us.echo_pattern",
    "breast_us.vascularity",
    "breast_us.mass_orientation",
    "breast_us.posterior_features",
  ],
  mappings: [
    { featureId: "breast_us.finding_type", key: "findingType", kind: "enum" },
    { featureId: "breast_us.mass_shape", key: "shape", kind: "enum" },
    { featureId: "breast_us.mass_margin", key: "margin", kind: "enum" },
    { featureId: "breast_us.echo_pattern", key: "echoPattern", kind: "enum" },
    { featureId: "breast_us.vascularity", key: "vascularity", kind: "enum" },
    { featureId: "breast_us.mass_orientation", key: "orientation", kind: "enum" },
    { featureId: "breast_us.posterior_features", key: "posteriorFeatures", kind: "enum" },
    {
      featureId: "breast_us.non_mass_echogenicity",
      key: "nonMassEchogenicity",
      kind: "enum",
      notApplicableEngineValue: "not_applicable",
    },
    {
      featureId: "breast_us.non_mass_distribution",
      key: "nonMassDistribution",
      kind: "enum",
      notApplicableEngineValue: "not_applicable",
    },
    {
      featureId: "breast_us.non_mass_associated_features",
      key: "nonMassAssociatedFeatures",
      kind: "enum",
      notApplicableEngineValue: "not_applicable",
    },
  ],
};

export function toBiradsUsInput(
  observations: readonly MorphologyObservation[],
  options: ToEngineOptions = {},
): ToEngineResult<BiradsInput> {
  const built = buildEngineFields(observations, BIRADS_US_SPEC, options);
  const errors = [...built.errors];

  if (built.fields.findingType === "non_mass") {
    const naMass = MASS_DESCRIPTORS.filter((f) => built.notApplicable.includes(f));
    if (naMass.length) {
      errors.push({
        code: "unsupported_transformation",
        message: `BiradsInput requires mass descriptors even for non_mass; ${naMass.join(", ")} marked not_applicable cannot be represented without inventing values`,
      });
    }
  }

  return finalizeEngineInput(
    "birads_us",
    built,
    { input: built.fields as BiradsInput, missing: built.missing, errors, warnings: built.warnings, incomplete: [] },
    options,
  );
}

export function fromBiradsUsInput(input: BiradsInput, options: FromEngineOptions): FromEngineResult {
  const { observations, lossy } = buildObservationsFromFields(
    input as unknown as Record<string, unknown>,
    BIRADS_US_SPEC,
    options,
  );
  return { observations, lossy, context: undefined };
}
