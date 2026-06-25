import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeVascularUltrasoundAssist } from "@/lib/ai/vascular-ultrasound-assist";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  mode: z.enum(["clinical", "teaching", "report"]).optional(),
  basin: z
    .enum(["extracranial", "tcd", "lower-limb-arteries", "lower-limb-veins", "upper-limb", "abdominal-aorta"])
    .optional(),
  freeText: z.string().max(12000).optional(),
  clinicalContext: z.string().max(2000).optional(),
  carotid: z
    .object({
      psvIcaCmS: z.number().finite().optional().nullable(),
      edvIcaCmS: z.number().finite().optional().nullable(),
      psvCcaCmS: z.number().finite().optional().nullable(),
      morphologicPercent: z.number().min(0).max(100).optional().nullable(),
      occlusionSuspected: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `ai-vascular:${auth.ok ? auth.userId : "dev"}`,
    RL.aiThyroid.limit,
    RL.aiThyroid.windowMs,
  );
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

  const result = await analyzeVascularUltrasoundAssist(parsed.data);
  return NextResponse.json({
    result,
    meta: { pipeline: result.pipeline, assistive: true, domain: "vascular-ultrasound" },
  });
}
