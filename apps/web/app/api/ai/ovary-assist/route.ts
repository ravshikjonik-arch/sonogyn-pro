import { NextResponse } from "next/server";

import {
  analyzeOvaryUltrasoundAssist,
  type OvaryAiAssistInput,
} from "@/lib/ai/ovary-ultrasound-assist";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(`ai-ovary:${auth.ok ? auth.userId : "dev"}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  let body: OvaryAiAssistInput;
  try {
    body = (await request.json()) as OvaryAiAssistInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = analyzeOvaryUltrasoundAssist(body);
  return NextResponse.json({ result, meta: { pipeline: "ovary-assist-v1", assistive: true } });
}
