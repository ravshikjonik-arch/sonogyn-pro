import { NextResponse } from "next/server";

import { getAdapterCatalog, searchEvidenceUnified } from "@repo/evidence-retrieval";

import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/** Lightweight health probe per provider (authenticated + rate limited). */
export async function GET() {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `evidence-sources-status:${auth.userId}`,
    RL.evidenceSearch.limit,
    RL.evidenceSearch.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const config = await buildRetrievalConfigAsync();
  const probe = await searchEvidenceUnified(
    { query: "pregnancy ultrasound screening", limit: 3, providers: ["static_corpus", "kr_mz_rf"] },
    { config, enrichCrossref: false },
  );

  return NextResponse.json({
    catalog: getAdapterCatalog(),
    probe: {
      query: probe.query,
      recordCount: probe.records.length,
      providers: probe.providers.map((p) => ({
        id: p.provider,
        status: p.status,
        count: p.records.length,
        latencyMs: p.latencyMs,
        error: p.error,
      })),
    },
    checkedAt: new Date().toISOString(),
  });
}
