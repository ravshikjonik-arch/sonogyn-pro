import { NextResponse } from "next/server";

import {
  analyzeNosologyUltrasoundAssist,
  type NosologyAiAssistInput,
} from "@/lib/ai/nosology-ultrasound-assist";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `ai-nosology:${auth.ok ? auth.userId : "dev"}`,
    RL.aiNosology.limit,
    RL.aiNosology.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  let body: NosologyAiAssistInput;
  try {
    body = (await request.json()) as NosologyAiAssistInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.context?.title) {
    return NextResponse.json({ error: "context.title required" }, { status: 400 });
  }

  const result = analyzeNosologyUltrasoundAssist(body);
  return NextResponse.json({ result, meta: { pipeline: "nosology-assist-v1", assistive: true } });
}
