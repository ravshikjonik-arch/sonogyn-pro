import { calculateSwedeScore, type SwedeScoreInput } from "@repo/medical-calculations";

import type { SwedeScoreInputDto } from "../domain/schemas";

/** Part 5 — Swede Score + IFCPC auto-mapping. */
export function evaluateSwedeScore(input: SwedeScoreInputDto) {
  const swedeInput: SwedeScoreInput = { ...input };
  return calculateSwedeScore(swedeInput);
}

/** Maps Swede 0–2 levels → IFCPC finding ids for risk/ CDS pipelines. */
export function mapSwedeToIfcpcFindings(input: SwedeScoreInputDto): string[] {
  const ids: string[] = [];
  if (input.acetowhite === 1) ids.push("thin_acetowhite");
  if (input.acetowhite === 2) ids.push("dense_acetowhite");
  if (input.vessels === 1) ids.push("fine_punctation");
  if (input.vessels === 2) {
    ids.push("coarse_punctation", "atypical_vessels");
  }
  if (input.margins === 2) ids.push("sharp_border", "ridge_sign");
  if (input.iodine === 2) ids.push("dense_acetowhite");
  return [...new Set(ids)];
}

export function mergeIfcpcWithSwede(colposcopyIds: string[], swedeIds: string[]): string[] {
  return [...new Set([...colposcopyIds, ...swedeIds])];
}
