import type { ThyroidStructuredReportInput } from "@repo/types";

import type { TiradsInput } from "../features/tirads/logic/tiradsCalculator";

/** Map mobile ACR TI-RADS form → SRE thyroid input (shared engine enums). */
export function mapTiradsToSreInput(
  input: TiradsInput,
  sizeMm?: number,
): ThyroidStructuredReportInput {
  const compositionMap: Record<TiradsInput["composition"], NonNullable<ThyroidStructuredReportInput["morphology"]["composition"]>> = {
    cystic: "cystic",
    spongiform: "spongiform",
    mixed: "mixed",
    solid: "solid",
    indeterminate: "solid",
  };
  const echogenicityMap: Record<
    TiradsInput["echogenicity"],
    NonNullable<ThyroidStructuredReportInput["morphology"]["echogenicity"]>
  > = {
    anechoic: "anechoic",
    hyperechoic_isoechoic: "hyperechoic_or_isoechoic",
    hypoechoic: "hypoechoic",
    very_hypoechoic: "very_hypoechoic",
  };
  const shapeMap: Record<TiradsInput["shape"], NonNullable<ThyroidStructuredReportInput["morphology"]["shape"]>> = {
    wider: "wider_than_tall",
    taller: "taller_than_wide",
  };
  const marginMap: Record<TiradsInput["margin"], NonNullable<ThyroidStructuredReportInput["morphology"]["margin"]>> = {
    smooth: "smooth",
    lobulated_irregular: "lobulated_or_irregular",
    ete: "extrathyroidal_extension",
  };
  const fociMap: Record<
    TiradsInput["echogenicFoci"],
    NonNullable<ThyroidStructuredReportInput["morphology"]["echogenicFoci"]>
  > = {
    none: "none_or_comet_tail",
    comet_small: "none_or_comet_tail",
    coarse: "macrocalcifications",
    rim: "peripheral_rim",
    punctate: "punctate",
  };

  const diameter = sizeMm ?? input.largestDiameterMm;

  return {
    domain: "thyroid",
    measurements: {
      noduleMaxDiameterMm: typeof diameter === "number" && Number.isFinite(diameter) ? diameter : undefined,
    },
    morphology: {
      composition: compositionMap[input.composition],
      echogenicity: echogenicityMap[input.echogenicity],
      shape: shapeMap[input.shape],
      margin: marginMap[input.margin],
      echogenicFoci: fociMap[input.echogenicFoci],
    },
  };
}
