import type { AdnexTriangulation } from "@repo/adnex-education";
import { mapSreToAdnexInput, type AdnexInput } from "@repo/iota-models";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";
import { mapOradsTreeToSreInput } from "@repo/report-engine";

/** O-RADS US wizard result → partial ADNEX fields (parity with web OradsWizardResultTabs). */
export function mapOradsWizardToAdnexInput(
  path: OradsTreePathStep[],
  result: OradsTreeResult,
  pathSummary: string[],
  triangulation: AdnexTriangulation,
): Partial<AdnexInput> {
  const sre = mapOradsTreeToSreInput(path, result, pathSummary, triangulation);
  return mapSreToAdnexInput(sre);
}
