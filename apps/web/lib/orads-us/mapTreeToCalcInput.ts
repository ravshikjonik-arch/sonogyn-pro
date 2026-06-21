import type { AdnexCalcInput, AdnexTriangulation } from "@repo/adnex-education";
import type { OradsTreePathStep } from "@repo/orads-us";

/** Map O-RADS US wizard path → adnex-education calculator input. */
export function mapOradsTreeToCalcInput(path: OradsTreePathStep[]): AdnexCalcInput {
  const input: AdnexCalcInput = {};

  for (const step of path) {
    switch (step.nodeId) {
      case "step1_localization":
        if (step.optionId === "ovarian") input.localization = "ovarian";
        if (step.optionId === "extraovarian") input.localization = "extraovarian";
        break;
      case "step2_menopause":
        if (step.optionId === "pre") input.menopause = "pre";
        if (step.optionId === "post") input.menopause = "post";
        break;
      case "step2_lesion_class":
        if (step.optionId === "physiological") input.lesionKind = "physiological";
        if (step.optionId === "simple") input.structure = "unilocular";
        if (step.optionId === "multilocular") input.structure = "multilocular";
        if (step.optionId === "solid") input.structure = "solid";
        break;
      case "step3_locularity":
        if (step.optionId === "unilocular") input.structure = "unilocular";
        if (step.optionId === "multilocular") input.structure = "multilocular";
        break;
      case "step3_simple_wall":
      case "step3_unilocular_wall":
      case "step3_bilocular_wall":
      case "step3_multilocular_wall":
        if (step.optionId === "irregular" || step.optionId === "irregular_nodule") {
          input.solidType = "irregular";
        }
        break;
      case "step4_solid_dominant_contour":
      case "step4_solid_surface":
        if (step.optionId === "smooth") input.solidType = "smooth";
        if (step.optionId === "irregular") input.solidType = "irregular";
        if (step.optionId === "papillary") input.solidType = "papillary";
        break;
      case "step4_solid_presence":
      case "step4_solid_component":
        if (step.optionId === "yes" || step.optionId === "present") input.solidComponent = true;
        if (step.optionId === "no" || step.optionId === "absent") input.solidComponent = false;
        break;
      case "step3_multilocular_septa":
        if (step.optionId === "thin") input.septaThickness = "thin";
        if (step.optionId === "thick") input.septaThickness = "thick";
        break;
      case "step5_ascites":
        if (step.optionId === "yes" || step.optionId === "ascites" || step.optionId === "both") {
          input.ascites = true;
        }
        if (step.optionId === "no") input.ascites = false;
        break;
      case "step5_acoustic_shadow":
        if (step.optionId === "yes") input.acousticShadows = true;
        if (step.optionId === "no") input.acousticShadows = false;
        break;
      case "step5_doppler":
      case "step4_color_score":
        if (step.optionId === "cs1" || step.optionId === "none") {
          input.iotaColorScore = "1";
          input.bloodFlow = "none";
        }
        if (step.optionId === "cs12") {
          input.iotaColorScore = "2";
          input.bloodFlow = "minimal";
        }
        if (step.optionId === "cs23") {
          input.iotaColorScore = "3";
          input.bloodFlow = "moderate";
        }
        if (step.optionId === "cs34") {
          input.iotaColorScore = "4";
          input.bloodFlow = "marked";
        }
        break;
      case "step4_papillary_count":
        if (["1", "2", "3", "4plus"].includes(step.optionId)) {
          input.papillaryProjectionCount = step.optionId as AdnexCalcInput["papillaryProjectionCount"];
        }
        break;
      default:
        break;
    }
  }

  return input;
}
