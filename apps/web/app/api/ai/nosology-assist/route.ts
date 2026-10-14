import { NextResponse } from "next/server";

import {
  analyzeNosologyUltrasoundAssist,
} from "@/lib/ai/nosology-ultrasound-assist";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import {
  NosologyAssistBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";
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

  const parsedJson = await parseJsonBody(request);
  if (!parsedJson.ok) return parsedJson.response;

  const parsed = NosologyAssistBodySchema.safeParse(parsedJson.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const phiBlocked = rejectIfPhiInTextFields([
    parsed.data.userNotes,
    parsed.data.voiceTranscript,
    parsed.data.context.title,
  ]);
  if (phiBlocked) return phiBlocked;

  const result = analyzeNosologyUltrasoundAssist(parsed.data);
  return NextResponse.json({ result, meta: { pipeline: "nosology-assist-v1", assistive: true } });
}
