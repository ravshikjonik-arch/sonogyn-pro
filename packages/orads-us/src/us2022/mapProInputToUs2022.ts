import type { OradsInput } from "../pro/types";
import type { ColorScoreUs2022, MenopauseUs2022, MorphologyUs2022, OradsUs2022Input } from "./types";

function maxDiameterCm(input: OradsInput): number | null {
  const mm = [input.lengthMm, input.widthMm, input.heightMm]
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
  if (mm.length === 0) return null;
  return Math.max(...mm) / 10;
}

function resolveMenopause(input: OradsInput): MenopauseUs2022 {
  if (input.menopause === "pre") return "pre";
  if (input.menopause !== "post") return "";
  const age = input.ageYears;
  if (typeof age === "number" && age >= 55) return "postLate";
  return "postEarly";
}

function resolveColorScore(input: OradsInput): ColorScoreUs2022 | null {
  const raw = input.iotaColorScore;
  if (raw === "1" || raw === "2" || raw === "3" || raw === "4") return Number(raw) as ColorScoreUs2022;
  return null;
}

function resolvePapillae(input: OradsInput): OradsUs2022Input["papillae"] {
  if (!input.solidComponent) return "0";
  if (input.solidType === "papillary" || input.papillaryProjectionCount) {
    if (input.papillaryProjectionCount === "4plus") return "4+";
    if (
      input.papillaryProjectionCount === "1" ||
      input.papillaryProjectionCount === "2" ||
      input.papillaryProjectionCount === "3"
    ) {
      return "1-3";
    }
  }
  return input.solidComponent ? "0" : "0";
}

function resolveExtraSigns(input: OradsInput): OradsUs2022Input["extraSigns"] {
  if (input.peritonealNodules) return "peritoneal";
  if (input.ascites) return "ascites";
  return "none";
}

function resolveMorphology(input: OradsInput): MorphologyUs2022 {
  if (input.lesionKind === "normal_ovary") return "normal";

  const classicSubtypes = new Set([
    "dermoid",
    "endometrioma",
    "hemorrhagic",
    "paraovarian",
    "peritoneal_inclusion",
    "hydrosalpinx",
  ]);
  if (input.unilocularSubtype && classicSubtypes.has(input.unilocularSubtype)) return "classic";

  if (input.structure === "solid") return "solid";

  if (input.structure === "multilocular") {
    if (
      !input.solidComponent &&
      input.septaCount === "1-3" &&
      input.septaThickness !== "thick"
    ) {
      return "bilocular";
    }
    return "multilocular";
  }

  if (input.structure === "unilocular") return "unilocular";
  return "";
}

function resolveClassicType(input: OradsInput): OradsUs2022Input["classicType"] {
  switch (input.unilocularSubtype) {
    case "dermoid":
      return "dermoid";
    case "endometrioma":
      return "endometrioma";
    case "hemorrhagic":
      return "hemorrhagic";
    case "paraovarian":
      return "paraovarian";
    case "peritoneal_inclusion":
      return "peritoneal";
    case "hydrosalpinx":
      return "hydrosalpinx";
    default:
      return "";
  }
}

/** Map O-RADS Pro form state to v2022 grid engine input. Returns null if lesion path is not supported. */
export function mapProInputToUs2022(input: OradsInput): OradsUs2022Input | null {
  if (input.localization === "extraovarian") {
    return {
      incomplete: false,
      menopause: resolveMenopause(input),
      cycleRegularity: "",
      morphology: "classic",
      classicType: input.unilocularSubtype === "hydrosalpinx" ? "hydrosalpinx" : "paraovarian",
      sizeCm: maxDiameterCm(input),
      cystContent: "simple",
      innerContour: "smooth",
      solidComponent: false,
      papillae: "0",
      colorScore: null,
      shadowing: false,
      outerContour: "smooth",
      extraSigns: "none",
    };
  }

  if (input.lesionKind === "physiological") return null;

  const morphology = resolveMorphology(input);
  if (!morphology) return null;

  const cystContent: OradsUs2022Input["cystContent"] =
    input.unilocularSubtype === "simple_cyst" || input.echogenicity === "anechoic"
      ? "simple"
      : "nonSimple";

  const innerContour: OradsUs2022Input["innerContour"] =
    input.structure !== "solid" && input.solidType === "irregular" ? "irregular" : "smooth";

  const outerContour: OradsUs2022Input["outerContour"] =
    input.structure === "solid" && input.solidType === "irregular" ? "irregular" : "smooth";

  return {
    incomplete: false,
    menopause: resolveMenopause(input),
    cycleRegularity: "",
    morphology,
    classicType: morphology === "classic" ? resolveClassicType(input) : "",
    sizeCm: maxDiameterCm(input),
    cystContent,
    innerContour,
    solidComponent: Boolean(input.solidComponent),
    papillae: resolvePapillae(input),
    colorScore: resolveColorScore(input),
    shadowing: Boolean(input.acousticShadows),
    outerContour,
    extraSigns: resolveExtraSigns(input),
  };
}
