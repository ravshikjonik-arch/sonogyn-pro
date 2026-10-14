import { NextResponse } from "next/server";

import { KnowledgeLinksQuerySchema } from "@repo/types";

import {
  codeFallbackFor,
  mergeKnowledgeLinks,
} from "@/lib/knowledge/knowledge-graph-links";
import { resolveRequestId, withRequestIdHeaders } from "@/lib/api/request-context";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/** Read-only knowledge graph edges (DB + code fallback). */
export async function GET(request: Request) {
  const requestId = resolveRequestId(request);
  const url = new URL(request.url);
  const parsedQuery = KnowledgeLinksQuerySchema.safeParse({
    fromType: url.searchParams.get("fromType"),
    fromId: url.searchParams.get("fromId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.flatten(), requestId },
      { status: 400, headers: withRequestIdHeaders(requestId) },
    );
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `knowledge-links:${auth.userId}`,
    RL.syncBurst.limit,
    RL.syncBurst.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов.", requestId },
      { status: 429, headers: withRequestIdHeaders(requestId) },
    );
  }

  const { fromType, fromId } = parsedQuery.data;
  const codeLinks = codeFallbackFor(fromType, fromId);

  const { data, error } = await supabase
    .from("knowledge_links")
    .select("id, from_type, from_id, relation, to_type, to_id, weight, meta")
    .eq("from_type", fromType)
    .eq("from_id", fromId)
    .order("weight", { ascending: false });

  if (error) {
    const { links, source } = mergeKnowledgeLinks(fromType, fromId, [], codeLinks);
    return NextResponse.json(
      { ok: true as const, fromType, fromId, links, source, requestId },
      { headers: withRequestIdHeaders(requestId) },
    );
  }

  const { links, source } = mergeKnowledgeLinks(fromType, fromId, data ?? [], codeLinks);

  return NextResponse.json(
    { ok: true as const, fromType, fromId, links, source, requestId },
    { headers: withRequestIdHeaders(requestId) },
  );
}
