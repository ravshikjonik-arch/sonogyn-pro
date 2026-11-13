import { createServiceRoleClient } from "@/utils/supabase/admin";

export type RegulationIngestJob = {
  id: string;
  source: string;
  external_id: string;
  source_url: string;
  title: string;
  content_hash: string;
  raw_snippet: string | null;
  document_kind: string | null;
  status: string;
  fetched_at: string;
  updated_at: string;
};

/**
 * Claim next regulation rows for background extraction (SKIP LOCKED RPC).
 * Requires migration 20261104120000_stage3_perf_indexes.sql applied.
 */
export async function claimRegulationIngestJobs(limit = 5): Promise<RegulationIngestJob[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("claim_regulation_ingest_jobs", {
    p_limit: Math.min(20, Math.max(1, limit)),
  });

  if (error) {
    // Fallback when migration not yet applied: soft claim without SKIP LOCKED
    const { data: rows, error: selErr } = await admin
      .from("regulation_ingest_queue")
      .select("*")
      .in("status", ["discovered", "pending_extraction"])
      .order("fetched_at", { ascending: true })
      .limit(Math.min(20, Math.max(1, limit)));

    if (selErr || !rows?.length) return [];

    const claimed: RegulationIngestJob[] = [];
    for (const row of rows) {
      const { data: updated } = await admin
        .from("regulation_ingest_queue")
        .update({ status: "pending_extraction", updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .in("status", ["discovered", "pending_extraction"])
        .select("*")
        .maybeSingle();
      if (updated) claimed.push(updated as RegulationIngestJob);
    }
    return claimed;
  }

  return (data ?? []) as RegulationIngestJob[];
}
