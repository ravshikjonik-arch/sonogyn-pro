import { NextResponse } from "next/server";

import { runMedicalIntelligenceForUser } from "@/lib/ai/mi/run-mi";
import { MiRequestSchema } from "@/lib/ai/mi/request-schema";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";
import type { MedicalIntelligenceRequest } from "@repo/medical-intelligence";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Off unless explicitly enabled (reversible rollout; no production behaviour change by default). */
function isEnabled(): boolean {
  const v = process.env.MI_ORCHESTRATOR_ENABLED?.trim();
  return v === "1" || v === "true";
}

/**
 * MI Orchestrator endpoint (Web cookie session or mobile `Authorization: Bearer`).
 * All outcomes of the medical workflow return 200 with `status`; HTTP errors are reserved for
 * transport/auth/limits. No persistence; responses never include provider details or secrets.
 */
export async function POST(request: Request) {
  if (!isEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(`mi-analyze:${auth.userId}`, RL.evidenceAssistant.limit, RL.evidenceAssistant.windowMs);
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
  const parsed = MiRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues.slice(0, 20).map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }

  try {
    const result = await runMedicalIntelligenceForUser(parsed.data as MedicalIntelligenceRequest, auth.userId);
    safeLog("mi.analyze", {
      requestId: result.requestId,
      inputType: result.inputType,
      status: result.status,
      providerCalls: result.processingMetadata.providerCalls,
      replay: result.processingMetadata.idempotentReplay,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal error", status: "failed" }, { status: 500 });
  }
}
