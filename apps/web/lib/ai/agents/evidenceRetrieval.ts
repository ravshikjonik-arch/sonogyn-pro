import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";
import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import {
  EVIDENCE_CORPUS_VERSION,
} from "@repo/evidence-corpus";
import { searchEvidenceUnified, synthesizeEvidenceAnswer } from "@repo/evidence-retrieval";

export async function runEvidenceRetrievalAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  const query = ctx.evidenceQuery?.trim() ?? "";

  if (query.length < 2) {
    const bundle = wrapClinicalSupportBundle({
      summary:
        `SonoEvidence + Evidence Assistant: задайте clinical question или откройте /tools/refs/evidence-assistant.`,
      findings: [],
      followUpSuggestions: [
        "Evidence Assistant (/tools/refs/evidence-assistant) — PubMed, Cochrane, КР МЗ РФ.",
        "SonoEvidence (/evidence) — курируемая база 236 тем.",
      ],
      additionalTestsSuggestions: [],
      citations: [
        { label: `Corpus ${EVIDENCE_CORPUS_VERSION}`, href: "/tools/refs/evidence" },
        { label: "Evidence Assistant", href: "/tools/refs/evidence-assistant" },
      ],
    });
    return { agent: "evidence_retrieval", bundle, hypotheses: [], warnings: [] };
  }

  const config = await buildRetrievalConfigAsync();
  const searchResult = await searchEvidenceUnified(
    { query, limit: 8, preferHighEvidence: true, maxAgeYears: 10 },
    { config },
  );
  const answer = synthesizeEvidenceAnswer(query, searchResult);

  const bundle = wrapClinicalSupportBundle({
    summary: answer.summary,
    findings: answer.citations.slice(0, 5).map((c) => ({
      title: c.title,
      detail: c.abstract?.slice(0, 240) || c.journal || c.provider,
      evidenceGrade:
        c.evidenceLevel === "I" || c.evidenceLevel === "II"
          ? "high"
          : c.evidenceLevel === "III"
            ? "moderate"
            : "low",
    })),
    followUpSuggestions: answer.recommendations.slice(0, 3),
    additionalTestsSuggestions: [],
    citations: answer.citations.slice(0, 6).map((c) => ({
      label: c.title.slice(0, 80),
      href: c.url,
    })),
  });

  return {
    agent: "evidence_retrieval",
    bundle,
    hypotheses: answer.citations.slice(0, 3).map((c, index) => ({
      rank: index + 1,
      statement: c.title,
      confidence: c.relevanceScore,
      rationale: `${c.provider}${c.year ? ` · ${c.year}` : ""}`,
    })),
    warnings: answer.contraindications.slice(0, 2),
  };
}
