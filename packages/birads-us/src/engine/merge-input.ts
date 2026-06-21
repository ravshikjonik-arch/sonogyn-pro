import { defaultBiradsBrochureInput, type BiradsBrochureInput } from "../biradsBrochure2025";

/** Слияние распознанных полей с текущим вводом (AI → калькулятор). */
export function mergeParsedBiradsInput(
  parsed: Partial<BiradsBrochureInput>,
  base: BiradsBrochureInput = defaultBiradsBrochureInput,
): BiradsBrochureInput {
  return {
    ...base,
    ...parsed,
    associatedFeatures:
      parsed.associatedFeatures && parsed.associatedFeatures.length > 0
        ? parsed.associatedFeatures
        : base.associatedFeatures ?? [],
    lymphNodeSites:
      parsed.lymphNodeSites && parsed.lymphNodeSites.length > 0
        ? parsed.lymphNodeSites
        : base.lymphNodeSites ?? [],
  };
}

/** Типовые дескрипторы для шаблонов атласа. */
export const BIRADS_PATHOLOGY_PRESETS: Partial<
  Record<
    string,
    Partial<BiradsBrochureInput> & { localizationText?: string }
  >
> = {
  simple_cyst: {
    specialCase: "simple_cyst",
    shape: "oval",
    orientation: "parallel",
    margin: "circumscribed",
    echoPattern: "anechoic",
    posteriorFeatures: "enhancement",
    vascularity: "none",
  },
  complicated_cyst: {
    specialCase: "complicated_cyst",
    shape: "oval",
    margin: "indistinct",
    echoPattern: "hypoechoic",
    posteriorFeatures: "enhancement",
  },
  clustered_microcysts: {
    specialCase: "microcyst_cluster",
    echoPattern: "anechoic",
    margin: "circumscribed",
  },
  fibroadenoma: {
    shape: "oval",
    orientation: "parallel",
    margin: "circumscribed",
    echoPattern: "hypoechoic",
    posteriorFeatures: "enhancement",
    vascularity: "none",
    localizationText: "Овальное гипоэхогенное образование, параллельное, чёткие контуры",
  },
  lipoma: {
    shape: "oval",
    margin: "circumscribed",
    echoPattern: "hyperechoic",
    orientation: "parallel",
  },
  papilloma: {
    echoPattern: "hypoechoic",
    margin: "indistinct",
    vascularity: "marked",
    associatedFeatures: ["duct_changes"],
  },
  fat_necrosis: {
    specialCase: "fat_necrosis",
    echoPattern: "hyperechoic",
    margin: "circumscribed",
    associatedFeatures: ["echogenic_rim"],
  },
  abscess: {
    specialCase: "abscess",
    echoPattern: "heterogeneous",
    margin: "indistinct",
    associatedFeatures: ["skin_thickening", "edema"],
    vascularity: "marked",
  },
  radial_scar: {
    associatedFeatures: ["architectural_distortion"],
    echoPattern: "hypoechoic",
    margin: "spiculated",
  },
  dcis: {
    findingType: "non_mass",
    nonMassEchogenicity: "ductal_change",
    nonMassDistribution: "segmental",
    calcifications: "micro_in_lesion",
  },
  idc: {
    shape: "irregular",
    orientation: "non_parallel",
    margin: "spiculated",
    echoPattern: "hypoechoic",
    posteriorFeatures: "shadowing",
    vascularity: "marked",
  },
  ilc: {
    echoPattern: "hypoechoic",
    margin: "indistinct",
    associatedFeatures: ["architectural_distortion"],
  },
  metastatic_node: {
    lymphNodeSites: ["axilla_I"],
    lymphNodeShape: "round",
    lymphNodeCortex: "focal",
    lymphNodeHilum: "effaced",
  },
};

export function presetForPathology(pathologyId: string): Partial<BiradsBrochureInput> | null {
  return BIRADS_PATHOLOGY_PRESETS[pathologyId] ?? null;
}
