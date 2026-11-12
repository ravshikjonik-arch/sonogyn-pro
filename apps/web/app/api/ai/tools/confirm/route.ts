import { NextResponse } from "next/server";

import { confirmClinicalToolInputs, ConfirmToolRequestSchema } from "@/lib/ai/sonogyn-chat/tools/confirm";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * Physician confirmation of the inputs of a review-gated chat tool (O-RADS, IOTA). Re-runs the local SSOT engine
 * with the confirmed fields only. No LLM call, no persistence; inputs are never logged.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(`ai-tool-confirm:${auth.userId}`, RL.evidenceAssistant.limit, RL.evidenceAssistant.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ConfirmToolRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = confirmClinicalToolInputs(parsed.data);
    safeLog("ai.tool.confirm", { tool: result.tool, ok: result.ok, status: result.status, review: result.review?.state });
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
