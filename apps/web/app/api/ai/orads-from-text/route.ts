import { buildOradsProtocolDraft } from "@repo/orads-us/assist/buildProtocolDraft";
import { runOradsAssistPipeline } from "@repo/orads-us/assist/runOradsAssistPipeline";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  text: z.string().min(8).max(8000),
  ageYears: z.number().int().min(14).max(100).optional(),
  menopause: z.enum(["pre", "post"]).optional(),
  /** When true — return protocol_draft only; category must come from @repo/orads-us locally. */
  draftOnly: z.boolean().optional(),
});

const PROTOCOL_AI_URL = process.env.PROTOCOL_AI_URL?.trim().replace(/\/$/, "");
const PROTOCOL_AI_SECRET = process.env.PROTOCOL_AI_SECRET?.trim();

const DISCLAIMER =
  "Информация носит справочный характер и не является диагнозом. Интерпретация — за лечащим специалистом.";

function localDraftResponse(text: string, menopause?: "pre" | "post", ageYears?: number) {
  const pipeline = runOradsAssistPipeline(text, { uiMenopause: menopause, profileAgeYears: ageYears });
  return {
    extracted: pipeline.extracted,
    features: [],
    protocol_draft: pipeline.protocolDraft,
    orads_hint: null,
    missing_fields: pipeline.unresolvedNodes,
    disclaimer: DISCLAIMER,
    pipeline: "orads-rule-v1-local",
    meta: { assistive: true, fallback: true, categorySource: "repo/orads-us-only" },
  };
}

/**
 * Proxy to Python protocol-ai worker for protocol prose.
 * Falls back to local rule-based draft when worker offline.
 * O-RADS category is never taken from this endpoint.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const userKey = auth.ok ? auth.userId : "dev";
  const rl = await consumeRateLimit(`ai-orads-text:${userKey}`, RL.aiOrads.limit, RL.aiOrads.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { text, ageYears, menopause, draftOnly } = parsed.data;

  if (!PROTOCOL_AI_URL) {
    return NextResponse.json(localDraftResponse(text, menopause, ageYears));
  }

  let res: Response;
  try {
    res = await fetch(`${PROTOCOL_AI_URL}/orads/from-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PROTOCOL_AI_SECRET ? { "X-Worker-Secret": PROTOCOL_AI_SECRET } : {}),
      },
      body: JSON.stringify({
        text,
        age_years: ageYears,
        menopause,
        use_llm: false,
      }),
    });
  } catch {
    return NextResponse.json(localDraftResponse(text, menopause, ageYears));
  }

  if (!res.ok) {
    return NextResponse.json(localDraftResponse(text, menopause, ageYears));
  }

  const payload = (await res.json()) as Record<string, unknown>;
  const draft =
    typeof payload.protocol_draft === "string"
      ? payload.protocol_draft
      : buildOradsProtocolDraft(text, runOradsAssistPipeline(text, { uiMenopause: menopause, profileAgeYears: ageYears }).extracted);

  return NextResponse.json({
    ...payload,
    protocol_draft: draft,
    orads_hint: draftOnly ? null : payload.orads_hint ?? null,
    meta: {
      assistive: true,
      proxied: true,
      categorySource: "repo/orads-us-only",
    },
  });
}
