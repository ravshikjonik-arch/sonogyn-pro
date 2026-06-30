import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";
import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import {
  CLINICAL_GUIDELINES,
  searchGuidelinesRanked,
} from "@repo/clinical-guidelines";
import { searchEvidenceUnified } from "@repo/evidence-retrieval";

export async function runGuidelineValidationAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  const query =
    ctx.evidenceQuery?.trim() ||
    "клинические рекомендации ультразвуковое исследование акушерство гинекология";

  const krHits = searchGuidelinesRanked(CLINICAL_GUIDELINES, query, 6);
  const config = await buildRetrievalConfigAsync();
  const external = await searchEvidenceUnified(
    {
      query,
      limit: 6,
      providers: ["kr_mz_rf", "who", "nice", "static_corpus"],
      preferHighEvidence: true,
    },
    { config, enrichCrossref: false },
  );

  const guidelineRecords = external.records.filter(
    (r) => r.recordType === "guideline" || r.provider === "kr_mz_rf" || r.provider === "who" || r.provider === "nice",
  );

  const findings = [
    ...krHits.map((h) => ({
      title: h.title,
      detail: h.snippet,
      confidence: h.score / 100,
      evidenceGrade: "high" as const,
    })),
    ...guidelineRecords.slice(0, 4).map((r) => ({
      title: r.title,
      detail: r.abstract?.slice(0, 200) || r.url,
      confidence: r.relevanceScore,
      evidenceGrade: "high" as const,
    })),
  ];

  const citations = [
    ...krHits.map((h) => {
      const g = CLINICAL_GUIDELINES.find((x) => x.id === h.id);
      return {
        label: h.title.slice(0, 90),
        href: g?.officialUrl || "/tools/refs/guidelines",
      };
    }),
    ...guidelineRecords.slice(0, 4).map((r) => ({
      label: r.title.slice(0, 90),
      href: r.url,
    })),
  ];

  const bundle = wrapClinicalSupportBundle({
    summary:
      findings.length > 0
        ? `Найдено ${findings.length} релевантных руководств/КР по запросу «${query.slice(0, 80)}». Сверьте тактику с действующими КР МЗ РФ и международными гайдлайнами (NICE/WHO).`
        : "Руководства не найдены по текущему запросу — уточните клинический контекст или откройте каталог КР.",
    findings: findings.slice(0, 8),
    followUpSuggestions: krHits.slice(0, 3).map((h) => h.title),
    additionalTestsSuggestions: [],
    citations: citations.slice(0, 8),
  });

  return {
    agent: "guideline_validation",
    bundle,
    hypotheses: findings.slice(0, 3).map((f, index) => ({
      rank: index + 1,
      statement: f.title,
      confidence: f.confidence,
      rationale: "Clinical guideline match",
    })),
    warnings: [],
  };
}
