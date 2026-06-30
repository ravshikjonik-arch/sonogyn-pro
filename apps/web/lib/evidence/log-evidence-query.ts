import type { AssistantAnswer } from "@repo/evidence-retrieval";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LogEvidenceQueryInput = {
  userId: string;
  query: string;
  sources: string[];
  resultCount: number;
  synthesisMode: string;
  evidenceStrength?: string | null;
};

export async function logEvidenceQuery(
  supabase: SupabaseClient,
  input: LogEvidenceQueryInput,
): Promise<void> {
  try {
    const { error } = await supabase.from("evidence_query_log").insert({
      user_id: input.userId,
      query: input.query.slice(0, 500),
      sources: input.sources,
      result_count: input.resultCount,
      synthesis_mode: input.synthesisMode,
      evidence_strength: input.evidenceStrength ?? null,
    });
    if (error) {
      console.warn("[evidence_query_log]", error.message);
    }
  } catch (err) {
    console.warn("[evidence_query_log]", err instanceof Error ? err.message : "insert failed");
  }
}

export function sourcesFromAssistantAnswer(answer: AssistantAnswer): string[] {
  return Object.keys(answer.sourcesUsed ?? {});
}

export function sourcesFromProviderResults(
  providers: { provider: string; status: string; records: unknown[] }[],
): string[] {
  return providers.filter((p) => p.records.length > 0).map((p) => p.provider);
}
