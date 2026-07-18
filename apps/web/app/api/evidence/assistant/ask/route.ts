import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdapterCatalog, searchEvidenceUnified, synthesizeEvidenceAnswer } from "@repo/evidence-retrieval";

import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import { logEvidenceQuery, sourcesFromAssistantAnswer } from "@/lib/evidence/log-evidence-query";
import { synthesizeWithLlm } from "@/lib/evidence/synthesize-llm";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  query: z.string().min(3).max(800),
  limit: z.number().int().min(1).max(30).optional(),
  useLlm: z.boolean().optional(),
  translateToRussian: z.boolean().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `evidence-assistant:${auth.userId}`,
    RL.evidenceAssistant.limit,
    RL.evidenceAssistant.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов к Evidence Assistant." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Укажите вопрос (3–800 символов)." }, { status: 400 });
  }

  const config = await buildRetrievalConfigAsync();
  const searchResult = await searchEvidenceUnified(
    {
      query: parsed.data.query,
      limit: parsed.data.limit ?? 25,
      preferHighEvidence: true,
      maxAgeYears: 10,
    },
    { config },
  );

  const useLlm = parsed.data.useLlm !== false;
  const answer = useLlm
    ? await synthesizeWithLlm(parsed.data.query, searchResult, {
        translateToRussian: parsed.data.translateToRussian !== false,
      })
    : synthesizeEvidenceAnswer(parsed.data.query, searchResult);

  try {
    await logEvidenceQuery(supabase, {
      userId: auth.userId,
      query: parsed.data.query,
      sources: sourcesFromAssistantAnswer(answer),
      resultCount: answer.citations.length,
      synthesisMode: answer.synthesisMode,
      evidenceStrength: answer.evidenceStrength,
    });
  } catch {
    /* non-fatal */
  }

  return NextResponse.json(answer);
}

export async function GET() {
  return NextResponse.json({
    catalog: getAdapterCatalog(),
    disclaimer:
      "Evidence Assistant — CDS. Использует PubMed, Europe PMC, Cochrane (via EPMC), Semantic Scholar, ClinicalTrials.gov, КР МЗ РФ, SonoEvidence, OpenFDA, DailyMed.",
  });
}
