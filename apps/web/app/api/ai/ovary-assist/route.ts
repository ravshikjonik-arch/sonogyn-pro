import { NextResponse } from "next/server";

import { analyzeOvaryUltrasoundAssist } from "@/lib/ai/ovary-ultrasound-assist";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import {
  OvaryAssistBodySchema,
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
    `ai-ovary:${auth.ok ? auth.userId : "dev"}`,
    RL.aiOvary.limit,
    RL.aiOvary.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  const parsedJson = await parseJsonBody(request);
  if (!parsedJson.ok) return parsedJson.response;

  const parsed = OvaryAssistBodySchema.safeParse(parsedJson.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const phiBlocked = rejectIfPhiInTextFields([parsed.data.userNotes]);
  if (phiBlocked) return phiBlocked;

  const result = analyzeOvaryUltrasoundAssist(parsed.data);
  return NextResponse.json({ result, meta: { pipeline: "ovary-assist-v1", assistive: true } });
}
