import { z } from "zod";
import {
  analyzeColposcopyImage,
  mergeAiIfcpcPredictions,
  evaluateCpiCase,
  CpiCaseInputSchema,
} from "@repo/cervical-pathology";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  imageUrl: z.string().url().max(2048),
  caseId: z.string().uuid(),
  input: CpiCaseInputSchema,
});

/** POST /api/cpi/ai/analyze — AI colposcopy assist (requires CPI_AI_COLPOSCOPY_URL). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const ai = await analyzeColposcopyImage({
      imageUrl: parsed.data.imageUrl,
      caseId: parsed.data.caseId,
      ifcpcSignIds: parsed.data.input.colposcopy.findingSignIds,
    });

    if (!ai.configured) {
      return NextResponse.json({
        configured: false,
        providerId: ai.providerId,
        analysis: ai.analysis,
        message: "Set CPI_AI_COLPOSCOPY_URL to enable AI colposcopy pipeline.",
      });
    }

    const mergedIds = mergeAiIfcpcPredictions(
      parsed.data.input.colposcopy.findingSignIds,
      ai.analysis,
    );

    const enrichedInput = {
      ...parsed.data.input,
      colposcopy: {
        ...parsed.data.input.colposcopy,
        findingSignIds: mergedIds,
      },
    };

    const evaluation = evaluateCpiCase(enrichedInput);

    if (auth.ok) {
      await supabase.from("cpi_audit_log").insert({
        user_id: auth.userId,
        case_id: parsed.data.caseId,
        action: "ai.colposcopy.analyzed",
        meta: {
          providerId: ai.providerId,
          cin2Plus: ai.analysis.cin2PlusProbability,
          cin3Plus: ai.analysis.cin3PlusProbability,
          predictions: ai.analysis.ifcpcPredictions.length,
        },
      });
    }

    return NextResponse.json({
      configured: true,
      providerId: ai.providerId,
      analysis: ai.analysis,
      mergedFindingIds: mergedIds,
      evaluation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
