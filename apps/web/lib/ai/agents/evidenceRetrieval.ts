import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact, OrchestratorContext } from "@/lib/ai/types";
import { askEvidence } from "@repo/evidence-engine";
import {
  EVIDENCE_CORPUS_VERSION,
  EVIDENCE_DISCLAIMER,
  EVIDENCE_ENTRIES,
} from "@repo/evidence-corpus";

export async function runEvidenceRetrievalAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
  const query = ctx.evidenceQuery?.trim() ?? "";

  if (query.length < 2) {
    const bundle = wrapClinicalSupportBundle({
      summary:
        `SonoEvidence v1 (${EVIDENCE_ENTRIES.length} записей, 7 полок): откройте /evidence для поиска с цитатами.`,
      findings: [],
      followUpSuggestions: ["Откройте раздел «УЗИ · база» (/evidence) и задайте вопрос по NT, PAPP-A, допплеру."],
      additionalTestsSuggestions: [],
      citations: [{ label: `Corpus ${EVIDENCE_CORPUS_VERSION}`, href: "/evidence" }],
    });
    return { agent: "evidence_retrieval", bundle, hypotheses: [], warnings: [] };
  }

  const result = askEvidence(EVIDENCE_ENTRIES, query, {
    limit: 3,
    disclaimer: EVIDENCE_DISCLAIMER,
    corpusVersion: EVIDENCE_CORPUS_VERSION,
  });

  const bundle = wrapClinicalSupportBundle({
    summary: result.answerSummary,
    findings: result.citations.map((c) => ({
      title: c.title,
      detail: c.clinicalPearl,
      evidenceGrade: c.tier === 1 ? "high" : c.tier === 2 ? "moderate" : "low",
    })),
    followUpSuggestions: result.citations.map((c) => c.title).slice(0, 3),
    additionalTestsSuggestions: [],
    citations: result.citations.map((c) => ({
      label: c.sourceLabel,
      href: c.url,
    })),
  });

  return {
    agent: "evidence_retrieval",
    bundle,
    hypotheses: result.citations.slice(0, 2).map((c, index) => ({
      rank: index + 1,
      statement: c.summary,
      confidence: c.tier === 1 ? 0.85 : c.tier === 2 ? 0.7 : 0.55,
      rationale: c.sourceLabel,
    })),
    warnings: [],
  };
}
