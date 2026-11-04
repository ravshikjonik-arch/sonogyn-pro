import { NextResponse } from "next/server";

import { extractRegulationWithLlm } from "@/lib/regulations/extract-with-llm";
import { claimRegulationIngestJobs } from "@/lib/regulations/claim-ingest-jobs";
import { isInternalNotifyAuthorized } from "@/lib/security/internal-notify-auth";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

/**
 * Stage 3: background dequeue + LLM extract for regulation_ingest_queue.
 * Auth: CRON_SECRET / internal notify (same as other crons).
 */
export async function GET(request: Request) {
  if (!isInternalNotifyAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitRaw = new URL(request.url).searchParams.get("limit");
  const limit = Math.min(5, Math.max(1, Number.parseInt(limitRaw ?? "2", 10) || 2));

  const jobs = await claimRegulationIngestJobs(limit);
  if (jobs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "queue empty" });
  }

  const admin = createServiceRoleClient();
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const job of jobs) {
    const rawText = job.raw_snippet?.trim() || "";
    if (rawText.length < 40) {
      results.push({ id: job.id, ok: false, error: "snippet_too_short" });
      continue;
    }

    const extracted = await extractRegulationWithLlm({
      title: job.title,
      sourceUrl: job.source_url,
      rawText,
    });

    if ("error" in extracted) {
      results.push({ id: job.id, ok: false, error: extracted.error });
      continue;
    }

    const { envelope, model } = extracted;
    const { error: insertError } = await admin.from("regulation_extractions").insert({
      queue_id: job.id,
      extracted_json: envelope,
      model,
      confidence: envelope.confidence,
    });

    if (insertError) {
      results.push({ id: job.id, ok: false, error: insertError.message });
      continue;
    }

    await admin
      .from("regulation_ingest_queue")
      .update({ status: "in_review", updated_at: new Date().toISOString() })
      .eq("id", job.id);

    results.push({ id: job.id, ok: true });
  }

  return NextResponse.json({
    ok: true,
    processed: results.filter((r) => r.ok).length,
    results,
  });
}
