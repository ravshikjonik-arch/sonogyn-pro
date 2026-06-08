import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";

export async function runGuidelineValidationAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  void ctx;

  const bundle = wrapClinicalSupportBundle({
    summary:
      "Валидация по руководствам (ISUOG/ACOG/SMFM/NICE/FIGO) будет выполняться через RAG над доверенными источниками.",
    findings: [
      {
        title: "Источники доказательностей",
        detail:
          "Публичные резюме и цитируемые отрывки подключим к Evidence Retrieval агенту; произвольный веб-поиск отключён.",
        confidence: 0.25,
        evidenceGrade: "moderate",
      },
    ],
    followUpSuggestions: [],
    additionalTestsSuggestions: [],
    citations: [],
  });

  return {
    agent: "guideline_validation",
    bundle,
    hypotheses: [],
    warnings: [],
  };
}
