import type { BiradsBrochureInput } from "../biradsBrochure2025";
import {
  buildBiradsBrochureProtocol,
  evaluateBiradsBrochure,
  resolveBiradsBrochureCategory,
} from "../biradsBrochure2025";
import { enrichEngineResult } from "./enrich-result";

export type StructuredBiradsReport = {
  breastComposition: string;
  lesionDescription: string;
  regionalLymphNodes: string;
  biradsAssessment: string;
  clinicalRecommendation: string;
  fullProtocol: string;
  engine: ReturnType<typeof enrichEngineResult>;
};

function labelGtc(gtc?: string): string {
  const map: Record<string, string> = {
    minimal: "Минимальная GTC (<25%)",
    mild: "Незначительная GTC (25–49%)",
    moderate: "Умеренная GTC (50–74%)",
    pronounced: "Выраженная GTC (>75%)",
  };
  return gtc ? (map[gtc] ?? gtc) : "Не указано";
}

export function generateStructuredReport(input: BiradsBrochureInput): StructuredBiradsReport {
  const auto = evaluateBiradsBrochure(input);
  const result = resolveBiradsBrochureCategory(input, auto);
  const engine = enrichEngineResult(input, result);
  const fullProtocol = buildBiradsBrochureProtocol(input);

  const lesionDescription =
    input.findingType === "non_mass"
      ? `NML: ${input.nonMassEchogenicity}, распределение ${input.nonMassDistribution}`
      : `Mass: ${input.shape}, ${input.orientation}, ${input.margin}, ${input.echoPattern}, posterior ${input.posteriorFeatures}`;

  const ln =
    (input.lymphNodeSites?.length ?? 0) > 0
      ? `ЛУ: ${input.lymphNodeSites?.join(", ")}; кора ${input.lymphNodeCortex ?? "—"}; ворота ${input.lymphNodeHilum ?? "—"}`
      : "Регионарные ЛУ без описанных изменений";

  return {
    breastComposition: labelGtc(input.gtcAmount),
    lesionDescription,
    regionalLymphNodes: ln,
    biradsAssessment: `${engine.category} · риск ${engine.malignancyRisk}`,
    clinicalRecommendation: engine.biopsyRecommended
      ? `Рекомендована биопсия. ${engine.management}`
      : engine.followUp,
    fullProtocol,
    engine,
  };
}
