import type { AdnexStructuredReportInput } from "@repo/types";
import type { AdnexTriangulation } from "@repo/adnex-education";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";

import { mapOradsTreeToCalcInput } from "@/lib/orads-us/mapTreeToCalcInput";
import { classificationFromTriangulation } from "@/lib/reports/sre-classification";

/** Map O-RADS wizard path + triangulation → SRE adnex input (T1.10). */
export function mapOradsTreeToSreInput(
  path: OradsTreePathStep[],
  result: OradsTreeResult,
  pathSummary: string[] = [],
  triangulation?: AdnexTriangulation | null,
): AdnexStructuredReportInput {
  const calc = mapOradsTreeToCalcInput(path);
  const cat = result.categoryNumber;
  const oradsCategory = cat >= 1 && cat <= 5 ? (cat as 1 | 2 | 3 | 4 | 5) : undefined;

  return {
    domain: "adnex",
    study: {
      modality: "ultrasound",
      region: "Органы малого таза · придатки",
    },
    measurements: {
      lengthMm: calc.lengthMm,
      widthMm: calc.widthMm,
      heightMm: calc.heightMm,
    },
    morphology: {
      localization: calc.localization,
      menopause: calc.menopause,
      lesionKind: calc.lesionKind,
      structure: calc.structure,
      septaThickness: calc.septaThickness,
      solidComponent: calc.solidComponent,
      solidType: calc.solidType,
      largestSolidDiameterMm: calc.largestSolidDiameterMm,
      papillaryProjectionCount: calc.papillaryProjectionCount,
      acousticShadows: calc.acousticShadows,
      ascites: calc.ascites,
      bloodFlow: calc.bloodFlow,
      iotaColorScore: calc.iotaColorScore,
      incompleteSeptum: calc.incompleteSeptum,
    },
    classification: classificationFromTriangulation(oradsCategory, triangulation),
    navigatorPath: path.map((s) => ({ nodeId: s.nodeId, optionId: s.optionId })),
    freeTextFindings: pathSummary.length > 0 ? pathSummary.join("\n") : undefined,
  };
}
