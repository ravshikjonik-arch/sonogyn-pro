import { NextResponse } from "next/server";

import {
  MedicalKnowledgeRetrieveInputSchema,
  retrieveMedicalKnowledge,
} from "@repo/medical-knowledge";

import {
  createSupabaseKnowledgeRepository,
  hashRagQuery,
} from "@/lib/medical-knowledge/supabase-repository";
import { isFullOpenAccessEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 45;

/** Server-side clinical knowledge retrieval — no raw source chunks to client. */
export async function POST(request: Request) {
  const started = Date.now();
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isFullOpenAccessEnabled()) return auth.response;

  const userId = auth.ok ? auth.userId : null;

  const rlKey = userId
    ? `medical-knowledge:${userId}`
    : rateLimitKeyFromRequest(request, "medical-knowledge");
  const rl = await consumeRateLimit(rlKey, RL.evidenceAssistant.limit, RL.evidenceAssistant.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = MedicalKnowledgeRetrieveInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const repo = createSupabaseKnowledgeRepository(supabase);
  const result = await retrieveMedicalKnowledge(parsed.data, repo);

  const queryHash = hashRagQuery(parsed.data.query);
  if (userId) {
    await supabase.from("rag_query_logs").insert({
      user_id: userId,
      query_hash: queryHash,
      specialty: parsed.data.specialty ?? null,
      module: parsed.data.module ?? null,
      retrieved_source_ids: result.sourceMetadata.map((s) => s.id),
      knowledge_article_ids: result.canonicalResults.map((a) => a.id),
      response_status: result.conflicts.length ? "guard" : "ok",
      latency_ms: Date.now() - started,
    });
  }

  return NextResponse.json({
    ok: true,
    ...result,
    // Explicitly strip any accidental internal fields from future adapters
    evidenceChunks: result.evidenceChunks.map((c) => ({
      id: c.id,
      title: c.title,
      excerpt: c.excerpt,
      provider: c.provider,
    })),
  });
}
