import type { AdnexInput, PapillaryCount } from "@repo/iota-models";
import type { OradsInput } from "@repo/orads-us/pro";

function papFromOrads(count?: OradsInput["papillaryProjectionCount"]): PapillaryCount {
  if (count === "1") return 1;
  if (count === "2") return 2;
  if (count === "3") return 3;
  if (count === "4plus") return "4plus";
  return 0;
}

export function mapOradsProToAdnexInput(input: OradsInput): Partial<AdnexInput> {
  const maxD = Math.max(input.lengthMm ?? 0, input.widthMm ?? 0, input.heightMm ?? 0);
  const solidMm =
    input.solidComponent === false
      ? 0
      : input.largestSolidDiameterMm ?? (input.solidComponent ? undefined : 0);

  return {
    ageYears: input.ageYears ?? (input.menopause === "post" ? 58 : input.menopause === "pre" ? 42 : 45),
    oncologyCenter: input.iotaCenterType === "oncology",
    maxDiameterMm: maxD > 0 ? maxD : undefined,
    maxSolidDiameterMm: solidMm,
    moreThan10Locules: input.cystLoculesOver10 ?? false,
    papillaryCount: papFromOrads(input.papillaryProjectionCount),
    acousticShadows: input.acousticShadows ?? false,
    ascites: input.ascites ?? false,
  };
}
