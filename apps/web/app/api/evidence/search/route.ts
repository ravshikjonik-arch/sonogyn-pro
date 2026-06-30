import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAdapterCatalog,
  searchEvidenceUnified,
  type EvidenceProviderId,
} from "@repo/evidence-retrieval";

import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import { logEvidenceQuery, sourcesFromProviderResults } from "@/lib/evidence/log-evidence-query";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const PROVIDER_IDS = [
  "pubmed",
  "europe_pmc",
  "semantic_scholar",
  "cochrane",
  "clinical_trials",
  "kr_mz_rf",
  "static_corpus",
  "openfda",
  "dailymed",
  "who",
  "nice",
  "ema",
] as const satisfies readonly EvidenceProviderId[];

const QuerySchema = z.object({
  q: z.string().min(2).max(500),
  limit: z.coerce.number().int().min(1).max(40).optional(),
  providers: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const allowed = new Set<string>(PROVIDER_IDS);
      return v
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is EvidenceProviderId => allowed.has(s));
    }),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `evidence-search:${auth.userId}`,
    RL.evidenceSearch.limit,
    RL.evidenceSearch.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
    providers: url.searchParams.get("providers") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Параметр q обязателен (2–500 символов)." }, { status: 400 });
  }

  const result = await searchEvidenceUnified(
    {
      query: parsed.data.q,
      limit: parsed.data.limit ?? 25,
      providers: parsed.data.providers,
      preferHighEvidence: true,
      maxAgeYears: 12,
    },
    { config: await buildRetrievalConfigAsync() },
  );

  void logEvidenceQuery(supabase, {
    userId: auth.userId,
    query: parsed.data.q,
    sources: sourcesFromProviderResults(result.providers),
    resultCount: result.records.length,
    synthesisMode: "search",
    evidenceStrength: null,
  });

  return NextResponse.json({
    ...result,
    catalog: getAdapterCatalog(),
  });
}
