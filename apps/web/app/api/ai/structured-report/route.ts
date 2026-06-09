import { NextResponse } from "next/server";

import { buildDemoStructuredReport, type StructuredUltrasoundReport } from "@/lib/ai/structured-report";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Body = {
  studyNotes?: string;
  calculatorOutputs?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(`ai-structured:${auth.ok ? auth.userId : "dev"}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

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
