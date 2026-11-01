import { NextResponse } from "next/server";

import { buildUsPrepBriefing } from "@/lib/ai/us-prep-briefing";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import {
  UsPrepBriefingBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/ai/us-prep-briefing
 * Жалобы → брифинг для врача УЗИ (вопросы на исследовании, фокус, анализы/мазки, контекст КР).
 * audience=doctor_only — не для пациентки.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `ai-us-prep:${auth.ok ? auth.userId : "dev"}`,
    RL.aiUsPrep.limit,
    RL.aiUsPrep.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const parsedJson = await parseJsonBody(request);
  if (!parsedJson.ok) return parsedJson.response;

  const parsed = UsPrepBriefingBodySchema.safeParse(parsedJson.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const phiBlocked = rejectIfPhiInTextFields([
    parsed.data.complaints,
    parsed.data.visitContext,
  ]);
  if (phiBlocked) return phiBlocked;

  const result = buildUsPrepBriefing({
    complaints: parsed.data.complaints,
    domain: parsed.data.domain,
    role: parsed.data.role,
    visitContext: parsed.data.visitContext,
  });

  return NextResponse.json({
    result,
    meta: {
      pipeline: result.pipeline,
      assistive: true,
      audience: "doctor_only",
      patientVisible: false,
      role: result.role,
    },
  });
}
