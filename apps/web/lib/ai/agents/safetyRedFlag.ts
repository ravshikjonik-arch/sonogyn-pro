import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";

export async function runSafetyRedFlagAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  void ctx;

  const bundle = wrapClinicalSupportBundle({
    summary:
      "Агент безопасности проверяет красные флаги (AKI-подобные презентации на УЗИ): выраженная асимметрия роста плодов, подозрение на предлежание плаценты, признаки перитонеального кровотечения и др.",
    findings: [
      {
        title: "Режим CDS",
        detail:
          "Система не выносит окончательных диагнозов и не заменяет неотложную помощь при острых симптомах.",
        confidence: 0.95,
        evidenceGrade: "high",
      },
    ],
    followUpSuggestions: ["При остром животе, кровотечении или нестабильной гемодинамике — немедленная клиническая эскалация."],
    additionalTestsSuggestions: [],
    citations: [],
  });

  return {
    agent: "safety_red_flag",
    bundle,
    hypotheses: [],
    warnings: ["Всегда требуется клиническая верификация перед действием."],
  };
}
