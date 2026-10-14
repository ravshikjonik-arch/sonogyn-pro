import { NextResponse } from "next/server";

import { buildDemoStructuredReport, type StructuredUltrasoundReport } from "@/lib/ai/structured-report";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import {
  parseJsonBody,
  StructuredReportBodySchema,
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
    `ai-structured:${auth.ok ? auth.userId : "dev"}`,
    RL.aiStructured.limit,
    RL.aiStructured.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  const parsedJson = await parseJsonBody(request);
  if (!parsedJson.ok) return parsedJson.response;

  const parsed = StructuredReportBodySchema.safeParse(parsedJson.data ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const body = parsed.data;

  const phiBlocked = rejectIfPhiInTextFields([body.studyNotes]);
  if (phiBlocked) return phiBlocked;

  const demo = buildDemoStructuredReport();
  const extraFindings =
    body.studyNotes && body.studyNotes.trim().length > 0
      ? [
          {
            label: "Clinician free-text",
            recommendation: body.studyNotes.trim().slice(0, 400),
          },
        ]
      : [];

  const report: StructuredUltrasoundReport = {
    ...demo,
    findings: [...demo.findings, ...extraFindings],
  };

  return NextResponse.json({
    report,
    meta: {
      userId: auth.ok ? auth.userId : "dev",
      calculatorOutputs: body.calculatorOutputs ?? {},
      aiPipeline: "deterministic-demo",
    },
  });
}
