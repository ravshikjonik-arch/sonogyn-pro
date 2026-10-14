import { NextResponse } from "next/server";
import { z } from "zod";

import {
  loadCaseStructuredAccess,
  recordCaseStructuredExport,
} from "@/lib/structured-editor/case-structured-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-structured-export", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-structured-export", RL.casesListUser);
  if (userRl) return userRl;

  const access = await loadCaseStructuredAccess(supabase, routeParams.data.caseId, auth.userId);
  if (!access?.canRead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await recordCaseStructuredExport(supabase, {
    caseId: routeParams.data.caseId,
    userId: auth.userId,
    templateVersion: "case-v1",
  });

  return NextResponse.json({ ok: true });
}
