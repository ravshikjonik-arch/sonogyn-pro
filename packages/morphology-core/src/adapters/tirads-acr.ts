import type { TiradsAcrInput } from "@repo/tirads-acr";

import type { MorphologyObservation } from "../types";
import {
  buildEngineFields,
  buildObservationsFromFields,
  finalizeEngineInput,
  isExplicitlyStated,
  type AdapterSpec,
} from "./mapping";
import type { FromEngineOptions, FromEngineResult, ToEngineOptions, ToEngineResult } from "./types";

/** ACR TI-RADS only (`evaluateAcrTirads`). RU TI-RADS requires a separate adapter. */
export const TIRADS_ACR_SPEC: AdapterSpec = {
  engineId: "tirads_acr",
  anatomies: ["thyroid", "neck_lymph_nodes"],
  required: [
    "thyroid.acr_composition",
    "thyroid.acr_echogenicity",
    "thyroid.acr_shape",
    "thyroid.acr_margin",
    "thyroid.acr_echogenic_foci",
  ],
  mappings: [
    { featureId: "thyroid.acr_composition", key: "composition", kind: "enum" },
    { featureId: "thyroid.acr_echogenicity", key: "echogenicity", kind: "enum" },
    { featureId: "thyroid.acr_shape", key: "shape", kind: "enum" },
    { featureId: "thyroid.acr_margin", key: "margin", kind: "enum" },
    { featureId: "thyroid.acr_echogenic_foci", key: "echogenicFoci", kind: "enum_set" },
    { featureId: "thyroid.nodule_largest_diameter", key: "largestDiameterMm", kind: "quantity" },
    { featureId: "thyroid.gland_volume", key: "thyroidVolumeMl", kind: "quantity" },
    { featureId: "thyroid.parenchyma_echogenicity", key: "parenchymaEchogenicity", kind: "text" },
    { featureId: "thyroid.parenchyma_vascularity", key: "parenchymaVascularity", kind: "text" },
    { featureId: "thyroid.nodule_location", key: "noduleLocation", kind: "text" },
    {
      featureId: "neck_lymph_nodes.assessment",
      key: "lymphNodes",
      kind: "enum",
      notAssessedEngineValue: "not_assessed",
    },
  ],
};

export function toTiradsAcrInput(
  observations: readonly MorphologyObservation[],
  options: ToEngineOptions = {},
): ToEngineResult<TiradsAcrInput> {
  const spec = TIRADS_ACR_SPEC;
  const built = buildEngineFields(observations, spec, options);
  // Without size, decideFnaAndFollowUp returns fnaRecommended=false for TR3–TR5.
  const incomplete = isExplicitlyStated(built, spec, "thyroid.nodule_largest_diameter")
    ? []
    : ["thyroid.nodule_largest_diameter"];

  return finalizeEngineInput(
    "tirads_acr",
    built,
    {
      input: built.fields as TiradsAcrInput,
      missing: built.missing,
      errors: built.errors,
      warnings: built.warnings,
      incomplete,
    },
    options,
  );
}

export function fromTiradsAcrInput(input: TiradsAcrInput, options: FromEngineOptions): FromEngineResult {
  const { observations, lossy } = buildObservationsFromFields(
    input as unknown as Record<string, unknown>,
    TIRADS_ACR_SPEC,
    options,
  );
  return { observations, lossy, context: undefined };
}
