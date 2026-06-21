import type { AdnexStructuredReportInput } from "@repo/types";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";

/** Map O-RADS US decision-tree path → SRE adnex input (shared logic web/mobile). */
export function mapOradsTreeToSreInput(
  path: OradsTreePathStep[],
  result: OradsTreeResult,
  pathSummary: string[] = [],
): AdnexStructuredReportInput {
  const morphology: AdnexStructuredReportInput["morphology"] = {};

  for (const step of path) {
    switch (step.nodeId) {
      case "step1_localization":
        if (step.optionId === "ovarian") morphology.localization = "ovarian";
        if (step.optionId === "extraovarian") morphology.localization = "extraovarian";
        break;
      case "step2_menopause":
        if (step.optionId === "pre") morphology.menopause = "pre";
        if (step.optionId === "post") morphology.menopause = "post";
        break;
      case "step2_lesion_class":
        if (step.optionId === "physiological") morphology.lesionKind = "physiological";
        if (step.optionId === "simple") morphology.structure = "unilocular";
        if (step.optionId === "multilocular") morphology.structure = "multilocular";
        if (step.optionId === "solid") morphology.structure = "solid";
        break;
      case "step3_simple_wall":
        if (step.optionId === "atypical") morphology.solidType = "irregular";
        break;
      case "step4_solid_surface":
        if (step.optionId === "smooth") morphology.solidType = "smooth";
        if (step.optionId === "irregular") morphology.solidType = "irregular";
        if (step.optionId === "papillary") morphology.solidType = "papillary";
        break;
      case "step4_solid_component":
        if (step.optionId === "yes") morphology.solidComponent = true;
        if (step.optionId === "no") morphology.solidComponent = false;
        break;
      case "step3_multilocular_septa":
        if (step.optionId === "thin") morphology.septaThickness = "thin";
        if (step.optionId === "thick") morphology.septaThickness = "thick";
        break;
      case "step5_ascites":
        if (step.optionId === "yes") morphology.ascites = true;
        if (step.optionId === "no") morphology.ascites = false;
        break;
      case "step5_acoustic_shadow":
        if (step.optionId === "yes") morphology.acousticShadows = true;
        if (step.optionId === "no") morphology.acousticShadows = false;
        break;
      default:
        break;
    }
  }

  const cat = result.categoryNumber;
  const oradsCategory =
    cat >= 1 && cat <= 5 ? (cat as 1 | 2 | 3 | 4 | 5) : undefined;

  return {
    domain: "adnex",
    study: {
      modality: "ultrasound",
      region: "Органы малого таза · придатки",
    },
    measurements: {},
    morphology,
    classification: {
      oradsCategory,
      iotaBenignCodes: [],
      iotaMalignantCodes: [],
    },
    navigatorPath: path.map((s) => ({ nodeId: s.nodeId, optionId: s.optionId })),
    freeTextFindings: pathSummary.length > 0 ? pathSummary.join("\n") : undefined,
  };
}
