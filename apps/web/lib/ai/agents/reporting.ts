import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";

export async function runReportingAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  void ctx;

  const bundle = wrapClinicalSupportBundle({
    summary:
      "Генерация структурированных протоколов (OB/GYN, допплер, follow-up) будет собираться из измерений и выводов оркестратора.",
    findings: [],
    followUpSuggestions: [],
    additionalTestsSuggestions: [],
    citations: [],
  });

  return {
    agent: "reporting",
    bundle,
    hypotheses: [],
    warnings: [],
  };
}
