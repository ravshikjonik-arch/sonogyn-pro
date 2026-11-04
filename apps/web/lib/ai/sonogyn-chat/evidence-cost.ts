/**
 * P2 — cost / LLM-call metering helpers for Evidence UX (telemetry labels only).
 */

export type EvidenceLlmCallMeter = {
  /** Number of paid/cloud-or-local LLM round-trips for one Evidence chat UX request. */
  llmCalls: number;
  singlePass: boolean;
  synthesisMode: "llm" | "rules" | "none";
};

/** Build stable model label for ai_chat_events (no schema migration). */
export function evidenceCostModelLabel(meter: EvidenceLlmCallMeter): string {
  return `evidence:${meter.singlePass ? "single-pass" : "dual"}:llmCalls=${meter.llmCalls}:${meter.synthesisMode}`;
}

/**
 * Expected LLM calls for Evidence chat after P2 defaults:
 * - insufficient → 0
 * - single-pass + rules synthesis → 0
 * - single-pass + llm synthesis → 1
 * - dual LLM → synthesis (0|1) + narrative 1
 */
export function expectedEvidenceLlmCalls(input: {
  insufficient: boolean;
  singlePass: boolean;
  synthesisMode: "llm" | "rules";
}): number {
  if (input.insufficient) return 0;
  const synth = input.synthesisMode === "llm" ? 1 : 0;
  if (input.singlePass) return synth;
  return synth + 1;
}
