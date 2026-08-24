import { primaryEchogenicFocus } from "@repo/tirads-acr";
import type { TiradsAcrInput, TiradsAcrResult } from "@repo/tirads-acr";
import type { ThyroidStructuredReportInput } from "@repo/types";

/** Calculator ACR input → SRE thyroid form (single foci field = highest-point). */
export function mapTiradsAcrToSreInput(
  input: TiradsAcrInput,
  result?: Pick<TiradsAcrResult, "category" | "totalPoints" | "fnaRationale">,
): ThyroidStructuredReportInput {
  const fociNote =
    input.echogenicFoci.length > 1
      ? `Echogenic foci (ACR multi): ${input.echogenicFoci.join(", ")}.`
      : undefined;
  const resultNote = result
    ? `${result.category} · ${result.totalPoints} pts. ${result.fnaRationale}`
    : undefined;

  return {
    domain: "thyroid",
    measurements: {
      noduleMaxDiameterMm: input.largestDiameterMm,
      thyroidVolumeMl: input.thyroidVolumeMl,
    },
    morphology: {
      composition: input.composition === "no_nodule" ? undefined : input.composition,
      echogenicity: input.echogenicity,
      shape: input.shape,
      margin: input.margin,
      echogenicFoci: primaryEchogenicFocus(input.echogenicFoci),
      parenchymaEchogenicity: input.parenchymaEchogenicity,
      parenchymaVascularity: input.parenchymaVascularity,
      noduleLocation: input.noduleLocation,
    },
    freeTextFindings: [fociNote, resultNote].filter(Boolean).join(" ") || undefined,
  };
}
