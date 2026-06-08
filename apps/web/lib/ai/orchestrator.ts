import { runEvidenceRetrievalAgent } from "@/lib/ai/agents/evidenceRetrieval";
import { runGynecologyDifferentialAgent } from "@/lib/ai/agents/gynecologyDifferential";
import { runGuidelineValidationAgent } from "@/lib/ai/agents/guidelineValidation";
import { runObRiskStratificationAgent } from "@/lib/ai/agents/obRisk";
import { runReportingAgent } from "@/lib/ai/agents/reporting";
import { runSafetyRedFlagAgent } from "@/lib/ai/agents/safetyRedFlag";
import { runUltrasoundAnalysisAgent } from "@/lib/ai/agents/ultrasoundAnalysis";
import { CDS_FRAMING_HEADER } from "@/lib/ai/safety";
import type {
  AgentHypothesis,
  OrchestratorContext,
  OrchestratorResult,
} from "@/lib/ai/types";

function detectContradictions(
  hypotheses: AgentHypothesis[],
): string[] {
  const messages: string[] = [];
  const strong = hypotheses.filter((h) => h.confidence >= 0.75);

  if (strong.length >= 2) {
    const topics = new Set(strong.map((h) => h.statement.slice(0, 24)));
    if (topics.size >= 2) {
      messages.push(
        "Обнаружены сильные гипотезы из разных агентов — сверьте с первичными данными исследования.",
      );
    }
  }

  return messages;
}

/**
 * Multi-agent orchestrator — parallel fan-out, deterministic merge for MVP.
 * Next: weighted fusion, graph constraints, human-in-the-loop approvals.
 */
export async function runClinicalCopilotOrchestrator(
  ctx: OrchestratorContext,
): Promise<OrchestratorResult> {
  const agents = await Promise.all([
    runUltrasoundAnalysisAgent(ctx),
    runObRiskStratificationAgent(ctx),
    runGynecologyDifferentialAgent(ctx),
    runGuidelineValidationAgent(ctx),
    runReportingAgent(ctx),
    runSafetyRedFlagAgent(ctx),
    runEvidenceRetrievalAgent(ctx),
  ]);

  const hypotheses = agents.flatMap((a) =>
    a.hypotheses.map((h) => ({
      ...h,
      statement: `[${a.agent}] ${h.statement}`,
    })),
  );

  const rankedHypotheses = [...hypotheses].sort(
    (a, b) => b.confidence - a.confidence,
  );

  const contradictions = detectContradictions(rankedHypotheses);

  const executiveSummary =
    `${CDS_FRAMING_HEADER}\n\n` +
    agents
      .map((a) => `${a.agent}: ${a.bundle.summary}`)
      .join("\n\n");

  return {
    rankedHypotheses,
    contradictions,
    executiveSummary,
    agents,
  };
}
