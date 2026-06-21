import type { AdnexCalcInput } from "@repo/adnex-education";
import type { AdnexStructuredReportInput } from "@repo/types";

/** Map SRE input → adnex-education calculator input (no duplicate rules). */
export function mapAdnexStructuredInputToCalcInput(input: AdnexStructuredReportInput): AdnexCalcInput {
  const { morphology, measurements } = input;
  return {
    localization: morphology.localization,
    menopause: morphology.menopause,
    lesionKind: morphology.lesionKind,
    structure: morphology.structure,
    septaThickness: morphology.septaThickness,
    solidComponent: morphology.solidComponent,
    solidType: morphology.solidType,
    lengthMm: measurements.lengthMm,
    widthMm: measurements.widthMm,
    heightMm: measurements.heightMm,
    ascites: morphology.ascites,
    bloodFlow: morphology.bloodFlow,
    papillaryProjectionCount: morphology.papillaryProjectionCount,
    largestSolidDiameterMm: morphology.largestSolidDiameterMm,
    acousticShadows: morphology.acousticShadows,
    iotaColorScore: morphology.iotaColorScore,
    incompleteSeptum: morphology.incompleteSeptum,
  };
}

export function resolveOradsCategory(input: AdnexStructuredReportInput): 1 | 2 | 3 | 4 | 5 {
  const cat = input.classification.oradsCategory;
  if (cat != null) return cat;
  return 3;
}

export function maxMeasurementMm(input: AdnexStructuredReportInput): number {
  const { lengthMm = 0, widthMm = 0, heightMm = 0 } = input.measurements;
  return Math.max(lengthMm, widthMm, heightMm);
}
