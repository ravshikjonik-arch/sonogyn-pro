import type { AdnexStructuredReportInput } from "@repo/types";

import type { AdnexInput, PapillaryCount } from "./types";

function papFromSre(count?: string): PapillaryCount {
  if (count === "1") return 1;
  if (count === "2") return 2;
  if (count === "3") return 3;
  if (count === "4plus") return "4plus";
  return 0;
}

function inferAgeYears(input: AdnexStructuredReportInput): number {
  const menopause = input.morphology.menopause ?? input.patient?.menopausalStatus;
  if (menopause === "post") return 58;
  if (menopause === "pre") return 42;
  return 45;
}

function inferMoreThan10Locules(input: AdnexStructuredReportInput): boolean {
  const structure = input.morphology.structure;
  if (structure === "unilocular" || structure === "solid") return false;
  const path = input.navigatorPath ?? [];
  for (const step of path) {
    const id = `${step.nodeId}:${step.optionId}`.toLowerCase();
    if (id.includes("10") && (id.includes("locul") || id.includes("camer") || id.includes("chamber"))) {
      return true;
    }
  }
  return false;
}

export type MapSreToAdnexOptions = {
  ageYears?: number;
  ca125Uml?: number;
  oncologyCenter?: boolean;
};

/** Map structured adnex report → ADNEX model input (no patient identifiers). */
export function mapSreToAdnexInput(
  input: AdnexStructuredReportInput,
  opts?: MapSreToAdnexOptions,
): Partial<AdnexInput> {
  const m = input.morphology ?? {};
  const meas = input.measurements ?? {};
  const maxD = Math.max(meas.lengthMm ?? 0, meas.widthMm ?? 0, meas.heightMm ?? 0);
  const solidMm =
    m.solidComponent === false ? 0 : m.largestSolidDiameterMm ?? (m.solidComponent ? undefined : 0);

  return {
    ageYears: opts?.ageYears ?? inferAgeYears(input),
    oncologyCenter: opts?.oncologyCenter ?? false,
    maxDiameterMm: maxD > 0 ? maxD : undefined,
    maxSolidDiameterMm: solidMm,
    moreThan10Locules: inferMoreThan10Locules(input),
    papillaryCount: papFromSre(m.papillaryProjectionCount),
    acousticShadows: m.acousticShadows ?? false,
    ascites: m.ascites ?? false,
    ca125Uml: opts?.ca125Uml,
  };
}
