import type { AdnexTriangulation } from "@repo/adnex-education";
import type { OradsInput, OradsResult } from "@repo/orads-us/pro";
import { classificationFromTriangulation } from "@repo/report-engine";
import type { AdnexStructuredReportInput } from "@repo/types";

/** O-RADS Pro calculator state → SRE adnex input (parity with apps/web map-orads-to-sre-input). */
export function mapOradsToAdnexSreInput(
  orads: OradsInput,
  result: OradsResult,
  freeText?: string,
  triangulation?: AdnexTriangulation | null,
): AdnexStructuredReportInput {
  const cat = result.category;
  const oradsCategory = cat >= 1 && cat <= 5 ? (cat as 1 | 2 | 3 | 4 | 5) : undefined;

  return {
    domain: "adnex",
    study: {
      modality: "ultrasound",
      region: "Органы малого таза · придатки",
    },
    measurements: {
      lengthMm: orads.lengthMm,
      widthMm: orads.widthMm,
      heightMm: orads.heightMm,
    },
    morphology: {
      localization: orads.localization,
      menopause: orads.menopause,
      lesionKind: orads.lesionKind,
      structure: orads.structure,
      septaThickness: orads.septaThickness,
      solidComponent: orads.solidComponent,
      solidType: orads.solidType,
      largestSolidDiameterMm: orads.largestSolidDiameterMm,
      papillaryProjectionCount: orads.papillaryProjectionCount,
      acousticShadows: orads.acousticShadows,
      ascites: orads.ascites,
      peritonealNodules: orads.peritonealNodules,
      bloodFlow: orads.bloodFlow,
      iotaColorScore: orads.iotaColorScore,
      incompleteSeptum: orads.incompleteSeptum,
    },
    classification: classificationFromTriangulation(oradsCategory, triangulation),
    freeTextFindings: freeText?.trim() || orads.customDescription?.trim() || undefined,
  };
}
