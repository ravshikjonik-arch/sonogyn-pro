import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";

export async function runObRiskStratificationAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  void ctx;

  const bundle = wrapClinicalSupportBundle({
    summary:
      "Стратификация акушерских рисков будет доступна после поступления биометрии, допплера, длины шейки матки и контекста матери.",
    findings: [
      {
        title: "ФРП / допплер",
        detail:
          "После измерений UA/MCA/CPR и оценки роста можно будет выдавать поддерживающие подсказки с указанием неопределённости.",
        confidence: 0.2,
        evidenceGrade: "unknown",
      },
    ],
    followUpSuggestions: [
      "Заполните структурированные измерения или загрузите протокол со станции УЗИ.",
    ],
    additionalTestsSuggestions: [
      "Клинические маркеры преэклампсии, CBC, глюкоза — по показаниям лечащего врача.",
    ],
    citations: [],
  });

  return {
    agent: "ob_risk_stratification",
    bundle,
    hypotheses: [],
    warnings: [],
  };
}
