import { NextResponse } from "next/server";

import { buildDemoStructuredReport, type StructuredUltrasoundReport } from "@/lib/ai/structured-report";
import { createClient } from "@/utils/supabase/server";

type Body = {
  studyNotes?: string;
  calculatorOutputs?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      userId: session.user.id,
      calculatorOutputs: body.calculatorOutputs ?? {},
      aiPipeline: "deterministic-demo",
    },
  });
}
