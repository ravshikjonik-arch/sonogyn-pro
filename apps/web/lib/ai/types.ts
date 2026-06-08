import type { ClinicalSupportBundle } from "@/lib/copilot/types";

export type AgentName =
  | "ultrasound_analysis"
  | "ob_risk_stratification"
  | "gynecology_differential"
  | "guideline_validation"
  | "reporting"
  | "safety_red_flag"
  | "evidence_retrieval";

export type AgentHypothesis = {
  rank: number;
  statement: string;
  rationale: string;
  confidence: number;
};

export type AgentArtifact = {
  agent: AgentName;
  bundle: ClinicalSupportBundle;
  hypotheses: AgentHypothesis[];
  warnings: string[];
};

export type OrchestratorContext = {
  studyId: string;
  locale?: string;
};

export type OrchestratorResult = {
  rankedHypotheses: AgentHypothesis[];
  contradictions: string[];
  executiveSummary: string;
  agents: AgentArtifact[];
};
