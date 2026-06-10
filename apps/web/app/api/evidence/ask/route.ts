import { NextResponse } from "next/server";
import { z } from "zod";

import { askEvidence } from "@repo/evidence-engine";
import {
  EVIDENCE_CORPUS_VERSION,
  EVIDENCE_DISCLAIMER,
  EVIDENCE_ENTRIES,
  EVIDENCE_SHELVES,
} from "@repo/evidence-corpus";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  query: z.string().min(2).max(500),
  shelf: z.enum(["us-fmf", "obgyn", "cervix", "mammo", "onco", "endocrine", "surgery"]).optional(),
  limit: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `evidence-ask:${auth.userId}`,
    RL.evidenceAsk.limit,
    RL.evidenceAsk.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите." },
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
    return NextResponse.json({ error: "Укажите вопрос (2–500 символов)." }, { status: 400 });
  }

  const shelf = parsed.data.shelf;
  if (shelf) {
    const meta = EVIDENCE_SHELVES.find((s: { id: string; status: string }) => s.id === shelf);
    if (meta?.status !== "active") {
      return NextResponse.json(
        { error: "Эта полка ещё в разработке. Доступны: FMF, АГ, шейка, маммология, онкология." },
        { status: 400 },
      );
    }
  }

  const result = askEvidence(EVIDENCE_ENTRIES, parsed.data.query, {
    shelf,
    limit: parsed.data.limit,
    disclaimer: EVIDENCE_DISCLAIMER,
    corpusVersion: EVIDENCE_CORPUS_VERSION,
  });

  return NextResponse.json(result);
}

/** Справочник полок и версия корпуса (без rate limit — лёгкий GET). */
export async function GET() {
  return NextResponse.json({
    corpusVersion: EVIDENCE_CORPUS_VERSION,
    shelves: EVIDENCE_SHELVES,
    entryCount: EVIDENCE_ENTRIES.length,
    disclaimer: EVIDENCE_DISCLAIMER,
  });
}
