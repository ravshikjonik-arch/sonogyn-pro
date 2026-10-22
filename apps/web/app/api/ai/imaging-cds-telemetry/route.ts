import { NextResponse } from "next/server";
import { z } from "zod";

import { isImagingCdsHintTelemetryEnabled } from "@/lib/ai/imaging-cds/flags";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  domain: z.enum(["gyn", "breast"]),
  kind: z.enum(["hint_feedback", "applicability_block", "qc_warn"]),
  aiCategoryNumber: z.number().int().min(0).max(6).nullable().optional(),
  manualCategoryNumber: z.number().int().min(0).max(6).nullable().optional(),
  applicabilityCode: z.string().max(64).optional(),
  qcCodes: z.array(z.string().max(64)).max(10).optional(),
});

/** Aggregated CDS metrics — no images, no text, no patient ids in body. */
export async function POST(request: Request) {
  if (!isImagingCdsHintTelemetryEnabled()) {
    return NextResponse.json({ ok: true, skipped: "telemetry_disabled" });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  const rl = await consumeRateLimit(
    `imaging-cds-tel:${auth.ok ? auth.userId : "anon"}`,
    RL.aiOrads.limit,
    RL.aiOrads.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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

  console.info("[imaging-cds-telemetry]", {
    ...parsed.data,
    userId: auth.ok ? auth.userId : null,
  });

  return NextResponse.json({ ok: true });
}
