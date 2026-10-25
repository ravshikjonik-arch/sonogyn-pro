import { parseOradsProtocolText, type OradsExtractedInput } from "@repo/orads-us";
import {
  initialOradsUs2022Input,
  mapProInputToUs2022,
  type OradsInput,
  type OradsUs2022Input,
} from "@repo/orads-us/pro";

function vascularityToBloodFlow(v: OradsExtractedInput["vascularity"]): OradsInput["bloodFlow"] | undefined {
  switch (v) {
    case "none":
      return "none";
    case "low":
      return "minimal";
    case "moderate":
      return "moderate";
    case "high":
      return "marked";
    default:
      return undefined;
  }
}

function vascularityToColor(v: OradsExtractedInput["vascularity"]): OradsInput["iotaColorScore"] | undefined {
  switch (v) {
    case "low":
      return "2";
    case "moderate":
      return "3";
    case "high":
      return "4";
    default:
      return undefined;
  }
}

function extractedToProInput(ex: OradsExtractedInput): OradsInput {
  const input: OradsInput = { localization: ex.localization ?? "ovarian" };
  if (ex.ovarySide) input.ovarySide = ex.ovarySide;
  if (ex.menopause) input.menopause = ex.menopause;
  if (typeof ex.ageYears === "number") input.ageYears = ex.ageYears;
  const mm = ex.diameterMm ?? ex.lengthMm ?? ex.widthMm ?? ex.heightMm;
  if (typeof mm === "number" && mm > 0) input.lengthMm = mm;
  if (ex.solidComponent != null) input.solidComponent = ex.solidComponent;
  if (ex.ascites === "present") input.ascites = true;
  if (ex.contour === "irregular") input.solidType = "irregular";
  if (ex.septations === "thick") input.septaThickness = "thick";
  if (ex.septations === "thin") input.septaThickness = "thin";
  if (ex.vascularity) {
    input.bloodFlow = vascularityToBloodFlow(ex.vascularity);
    input.iotaColorScore = vascularityToColor(ex.vascularity);
  }
  if (ex.noFocalLesion || ex.lesionClass === "normal") {
    input.lesionKind = "normal_ovary";
    input.normalOvaryPattern = "typical";
  } else if (ex.lesionClass === "physiological") {
    input.lesionKind = "physiological";
    input.physiologicalType = "follicle";
  } else if (ex.lesionClass === "simple") {
    input.lesionKind = "nonphysiological";
    input.structure = "unilocular";
    input.unilocularSubtype = "simple_cyst";
  } else if (ex.structure === "solid") {
    input.lesionKind = "nonphysiological";
    input.structure = "solid";
  } else if (ex.structure === "multilocular" || ex.locularity === "multilocular") {
    input.lesionKind = "nonphysiological";
    input.structure = "multilocular";
    input.septaCount = ">3";
  } else if (ex.structure === "cystic" || ex.locularity === "unilocular" || ex.structure === "complex") {
    input.lesionKind = "nonphysiological";
    input.structure = "unilocular";
    if (ex.echogenicity === "anechoic") input.unilocularSubtype = "simple_cyst";
  }
  if (ex.echogenicity === "anechoic" && !input.unilocularSubtype) {
    input.echogenicity = "anechoic";
  }
  return input;
}

/** Rule-first: протокол → поля v2022 (через Pro-модель, движок не меняется). */
export function applyProtocolTextToUs2022(text: string): OradsUs2022Input | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const extracted = parseOradsProtocolText(trimmed);
  const pro = extractedToProInput(extracted);
  const mapped = mapProInputToUs2022(pro);
  if (!mapped?.morphology) return null;
  return { ...initialOradsUs2022Input, ...mapped };
}
