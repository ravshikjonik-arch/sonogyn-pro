import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeThyroidUltrasoundAssist } from "@/lib/ai/thyroid-ultrasound-assist";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

const FrameSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(80),
  base64: z.string().min(20).max(12_000_000),
});

const BodySchema = z.object({
  freeText: z.string().max(8000).optional(),
  clinicalContext: z.string().max(2000).optional(),
  frames: z.array(FrameSchema).max(3).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `ai-thyroid:${auth.ok ? auth.userId : "dev"}`,
    RL.aiThyroid.limit,
    RL.aiThyroid.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
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

  const phiBlocked = rejectIfPhiInTextFields([parsed.data.freeText, parsed.data.clinicalContext]);
  if (phiBlocked) return phiBlocked;

  const result = await analyzeThyroidUltrasoundAssist(parsed.data);
  return NextResponse.json({
    result,
    meta: { pipeline: result.pipeline, assistive: true, domain: "thyroid" },
  });
}
