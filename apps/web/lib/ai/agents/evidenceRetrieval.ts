import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";

export async function runEvidenceRetrievalAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  void ctx;

  const bundle = wrapClinicalSupportBundle({
    summary:
      "RAG-слой будет извлекать фрагменты из доверенной библиотеки (PubMed metadata + утверждённые guideline excerpts). Произвольный интернет отключён.",
    findings: [],
    followUpSuggestions: [],
    additionalTestsSuggestions: [],
    citations: [
      {
        label: "PubMed / PMC (доверенный источник абстрактов)",
      },
    ],
  });

  return {
    agent: "evidence_retrieval",
    bundle,
    hypotheses: [],
    warnings: [],
  };
}
