import { NextResponse } from "next/server";
import { z } from "zod";

import { runObstetricCopilot } from "@/lib/obstetric-expert/server";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

const GestationalAgeSchema = z.object({
  weeks: z.number().finite().min(6).max(44).optional(),
  days: z.number().finite().min(0).max(6).optional(),
});

const BiometricSchema = z.object({
  bpdMm: z.number().finite().positive().optional(),
  hcMm: z.number().finite().positive().optional(),
  acMm: z.number().finite().positive().optional(),
  flMm: z.number().finite().positive().optional(),
  hlMm: z.number().finite().positive().optional(),
  efwGrams: z.number().finite().positive().optional(),
  lateralVentricleMm: z.number().finite().positive().optional(),
});

const BodySchema = z.object({
  gestationalAge: GestationalAgeSchema.optional(),
  findings: z.array(z.string().max(500)).max(30).default([]),
  biometricData: BiometricSchema.optional(),
  maternalAgeYears: z.number().finite().min(15).max(55).optional(),
  crlMm: z.number().finite().positive().optional(),
  ntMm: z.number().finite().positive().optional(),
  nasalBone: z.enum(["present", "absent", "unknown"]).optional(),
  dvFlow: z.enum(["normal", "abnormal", "unknown"]).optional(),
  tricuspidRegurgitation: z.enum(["none", "present", "unknown"]).optional(),
  uaPi: z.number().finite().positive().optional(),
  mcaPi: z.number().finite().positive().optional(),
  dvPi: z.number().finite().positive().optional(),
  utaPi: z.number().finite().positive().optional(),
  biometryStandard: z.enum(["hadlock", "intergrowth", "who"]).optional(),
  reportFormat: z.enum(["brief", "detailed", "recommendations"]).optional(),
  indication: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `ai-obstetric-expert:${auth.ok ? auth.userId : "dev"}`,
    RL.aiThyroid.limit,
    RL.aiThyroid.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
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

  try {
    const result = runObstetricCopilot(parsed.data);
    return NextResponse.json({
      ok: true,
      executiveSummaryRu: result.executiveSummaryRu,
      differential: result.sonographer.differential,
      report: {
        briefConclusion: result.report.briefConclusion,
        detailedConclusion: result.report.detailedConclusion,
        fullText: result.report.fullText,
        recommendations: result.report.recommendations,
        isuogDisclaimer: result.report.isuogDisclaimer,
      },
      biometry: result.biometry,
      doppler: result.doppler,
      aneuploidy: result.aneuploidy,
      protocol: {
        completenessScore: result.protocol.completenessScore,
        summaryRu: result.protocol.summaryRu,
        nextActions: result.protocol.nextActions,
      },
      clinicalDecision: result.clinicalDecision,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Copilot error";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
