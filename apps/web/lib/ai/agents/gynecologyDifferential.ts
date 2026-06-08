import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";

export async function runGynecologyDifferentialAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  void ctx;

  const bundle = wrapClinicalSupportBundle({
    summary:
      "Гинекологический дифференциальный ряд будет формироваться из данных УЗИ малого таза, допплера и маркеров (O-RADS/IOTA и др.) после интеграции базы знаний.",
    findings: [],
    followUpSuggestions: ["Загрузите серии яичников/матки и при наличии — заключения предыдущих исследований."],
    additionalTestsSuggestions: ["Онкомаркеры и гормональный профиль — только по клиническим показаниям."],
    citations: [],
  });

  return {
    agent: "gynecology_differential",
    bundle,
    hypotheses: [],
    warnings: [],
  };
}
