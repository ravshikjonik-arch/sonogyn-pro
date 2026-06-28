import { defaultTiradsAcrInput, evaluateAcrTirads } from "@repo/tirads-acr";
import type { ThyroidStructuredReportInput } from "@repo/types";
import type { TiradsAcrInput } from "@repo/tirads-acr";

export function mapThyroidInputToTirads(input: ThyroidStructuredReportInput): TiradsAcrInput {
  const m = input.morphology;
  return {
    ...defaultTiradsAcrInput,
    composition: m.composition ?? defaultTiradsAcrInput.composition,
    echogenicity: m.echogenicity ?? defaultTiradsAcrInput.echogenicity,
    shape: m.shape ?? defaultTiradsAcrInput.shape,
    margin: m.margin ?? defaultTiradsAcrInput.margin,
    echogenicFoci: m.echogenicFoci ?? defaultTiradsAcrInput.echogenicFoci,
    largestDiameterMm: input.measurements.noduleMaxDiameterMm,
    thyroidVolumeMl: input.measurements.thyroidVolumeMl,
    parenchymaEchogenicity: m.parenchymaEchogenicity,
    parenchymaVascularity: m.parenchymaVascularity,
    noduleLocation: m.noduleLocation,
  };
}

export function evaluateThyroidFromInput(input: ThyroidStructuredReportInput) {
  return evaluateAcrTirads(mapThyroidInputToTirads(input));
}
