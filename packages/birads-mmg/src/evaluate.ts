import { BIRADS_MMG_CATEGORY_RECOMMENDATIONS } from "./options.js";
import type { BiradsCategoryCode, BiradsMmgInput, BiradsMmgResult } from "./types.js";

function riskFor(code: BiradsCategoryCode): string {
  switch (code) {
    case "1":
    case "2":
      return "0%";
    case "3":
      return "≤2%";
    case "4A":
      return "2–10%";
    case "4B":
      return "10–50%";
    case "4C":
      return "50–95%";
    case "5":
      return "≥95%";
    case "6":
      return "верифицирована";
    default:
      return "не оценивается";
  }
}

function toResult(code: BiradsCategoryCode, suggestedAutomatically: boolean): BiradsMmgResult {
  const rec = BIRADS_MMG_CATEGORY_RECOMMENDATIONS[code] ?? "";
  return {
    category: `BI-RADS ${code}`,
    categoryCode: code,
    riskRange: riskFor(code),
    description: rec,
    impression: rec,
    suggestedAutomatically,
  };
}

/**
 * Эвристический CDS по дескрипторам ACR BI-RADS Mammography.
 * Не заменяет решение врача — всегда доступна ручная категория.
 */
export function evaluateBiradsMmg(input: BiradsMmgInput): BiradsMmgResult {
  if (input.biradsCategoryManual) {
    return toResult(input.biradsCategoryManual, false);
  }

  if (input.findingType === "negative") {
    return toResult("1", true);
  }

  const assoc = input.associatedFeatures ?? [];
  const hasHighAssoc =
    assoc.includes("skin_retraction") ||
    assoc.includes("nipple_retraction") ||
    assoc.includes("architectural_distortion_assoc");

  if (input.findingType === "architectural_distortion") {
    return toResult(hasHighAssoc ? "5" : "4C", true);
  }

  if (input.findingType === "mass") {
    if (input.massDensity === "fat" && input.massMargin === "circumscribed") {
      return toResult("2", true);
    }
    if (input.massMargin === "spiculated") {
      return toResult("5", true);
    }
    if (input.massMargin === "indistinct" || input.massMargin === "microlobulated") {
      return toResult(input.massShape === "irregular" ? "4C" : "4B", true);
    }
    if (input.massMargin === "obscured") {
      return toResult(input.comparison === "new" || input.comparison === "increased" ? "0" : "4A", true);
    }
    if (input.massShape === "oval" && input.massMargin === "circumscribed") {
      if (input.comparison === "stable") return toResult("2", true);
      return toResult("3", true);
    }
    if (input.massShape === "irregular") {
      return toResult("4B", true);
    }
    return toResult("4A", true);
  }

  if (input.findingType === "calcifications") {
    if (input.calcMorphology === "typically_benign") {
      return toResult("2", true);
    }
    if (input.calcMorphology === "fine_linear") {
      return toResult("4C", true);
    }
    if (input.calcMorphology === "fine_pleomorphic") {
      return toResult(
        input.calcDistribution === "linear" || input.calcDistribution === "segmental" ? "4C" : "4B",
        true,
      );
    }
    if (input.calcMorphology === "amorphous" || input.calcMorphology === "coarse_heterogeneous") {
      return toResult(
        input.calcDistribution === "linear" || input.calcDistribution === "segmental" ? "4B" : "4A",
        true,
      );
    }
    return toResult("4A", true);
  }

  if (input.findingType === "asymmetry") {
    if (input.asymmetryType === "developing" || input.comparison === "new" || input.comparison === "increased") {
      return toResult("4A", true);
    }
    if (input.asymmetryType === "global" && input.comparison === "stable") {
      return toResult("2", true);
    }
    if (input.comparison === "none") {
      return toResult("0", true);
    }
    return toResult("3", true);
  }

  if (input.findingType === "associated_only") {
    if (hasHighAssoc) return toResult("4B", true);
    if (assoc.includes("axillary_adenopathy") || assoc.includes("skin_thickening")) {
      return toResult("0", true);
    }
    return toResult("0", true);
  }

  return toResult("0", true);
}
