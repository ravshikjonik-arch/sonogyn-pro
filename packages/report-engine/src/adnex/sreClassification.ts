import { evaluateAdnexTriangulation, type AdnexTriangulation } from "@repo/adnex-education";
import type { OradsTreePathStep } from "@repo/orads-us";
import type { AdnexStructuredReportInput } from "@repo/types";

import { mapOradsTreeToCalcInput } from "./mapOradsTreeToCalcInput";

export function classificationFromTriangulation(
  oradsCategory: number | undefined,
  tri?: AdnexTriangulation | null,
): AdnexStructuredReportInput["classification"] {
  const cat = oradsCategory != null && oradsCategory >= 1 && oradsCategory <= 5 ? oradsCategory : undefined;
  const iotaVerdict =
    tri?.iotaVerdict === "indeterminate"
      ? "inconclusive"
      : tri?.iotaVerdict === "benign" || tri?.iotaVerdict === "malignant"
        ? tri.iotaVerdict
        : undefined;

  return {
    oradsCategory: cat as 1 | 2 | 3 | 4 | 5 | undefined,
    iotaBenignCodes: tri?.iotaBenign ?? [],
    iotaMalignantCodes: tri?.iotaMalignant ?? [],
    iotaVerdict,
    triangulationAgreement: tri?.agreement,
  };
}

export function evaluateWizardTriangulation(
  path: OradsTreePathStep[],
  categoryNumber: number,
): AdnexTriangulation {
  const calcInput = mapOradsTreeToCalcInput(path);
  const cat = categoryNumber >= 0 && categoryNumber <= 5 ? categoryNumber : 3;
  return evaluateAdnexTriangulation(calcInput, cat);
}
