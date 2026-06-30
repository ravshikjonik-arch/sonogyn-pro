import { NextResponse } from "next/server";

import { getAdapterCatalog, searchEvidenceUnified } from "@repo/evidence-retrieval";

import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";

export const runtime = "nodejs";

/** Lightweight health probe per provider (cached ping). */
export async function GET() {
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
