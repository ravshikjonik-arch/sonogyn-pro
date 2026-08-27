import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeGynUltrasoundAssist } from "@/lib/ai/gyn-ultrasound-assist";
import { isDevSkipAuthEnabled, isFullOpenAccessEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
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
  menopause: z.enum(["pre", "post"]).optional(),
  profileAgeYears: z.number().int().min(14).max(100).optional(),
  frames: z.array(FrameSchema).max(3).optional(),
});

/** POST /api/ai/gyn-assist — снимок придатков → US AI Worker (gyn) + O-RADS assist. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled() && !isFullOpenAccessEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `ai-gyn:${auth.ok ? auth.userId : "open-access"}`,
    RL.aiOrads.limit,
    RL.aiOrads.windowMs,
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

  const result = await analyzeGynUltrasoundAssist(parsed.data);
  return NextResponse.json({
    result,
    meta: { pipeline: result.pipeline, assistive: true, domain: "gyn" },
  });
}
