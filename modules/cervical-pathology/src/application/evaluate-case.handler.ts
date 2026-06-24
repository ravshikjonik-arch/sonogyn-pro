import type { CpiCaseInput, CpiEvaluationResult } from "../domain/schemas";
import { CpiDisclaimer } from "../domain/schemas";
import { runClinicalDecisionSupport } from "../calculators/decision-engine";
import { buildIfcpcProtocol } from "../calculators/ifcpc-engine";
import { calculateCpiRisk, calculateQualityScore } from "../calculators/risk-engine";
import { evaluateSwedeScore, mapSwedeToIfcpcFindings, mergeIfcpcWithSwede } from "../calculators/swede-engine";

/** Application service — evaluate full CPI case (CQRS command handler). */
export function evaluateCpiCase(input: CpiCaseInput): CpiEvaluationResult {
  const swedeMappedIds = input.swede ? mapSwedeToIfcpcFindings(input.swede) : [];
  const mergedFindingIds = mergeIfcpcWithSwede(input.colposcopy.findingSignIds, swedeMappedIds);

  const ifcpc = buildIfcpcProtocol({
    ...input.colposcopy,
    findingSignIds: mergedFindingIds,
  });

  const swedeResult = input.swede ? evaluateSwedeScore(input.swede) : null;
  const risk = calculateCpiRisk(input, mergedFindingIds);
  const quality = input.quality ? calculateQualityScore(input.quality) : null;

  const cds = runClinicalDecisionSupport(input, mergedFindingIds, risk);

  return {
    schema: "cpi.evaluation.v1",
    version: "1.0.0",
    computedAt: new Date().toISOString(),
    ifcpcProtocolText: ifcpc.protocolText,
    ifcpcConclusion: ifcpc.conclusion,
    swedeTotal: swedeResult?.total ?? null,
    swedeMappedFindingIds: swedeMappedIds,
    risk,
    qualityScore: quality?.score ?? null,
    qualityInterpretation: quality?.interpretation ?? null,
    actions: cds.actions,
    explanation: cds.explanation,
    disclaimer: CpiDisclaimer,
  };
}
