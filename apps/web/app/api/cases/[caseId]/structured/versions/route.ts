import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listCaseStructuredVersions,
  loadCaseStructuredAccess,
  restoreCaseStructuredVersion,
} from "@/lib/structured-editor/case-structured-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });
const RestoreSchema = z.object({ versionId: z.string().uuid() });

export async function GET(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-structured-versions", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const access = await loadCaseStructuredAccess(supabase, routeParams.data.caseId, auth.userId);
  if (!access?.isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await listCaseStructuredVersions(supabase, routeParams.data.caseId);
  return NextResponse.json({ versions });
}

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-structured-restore", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-structured-restore", RL.casesListUser);
  if (userRl) return userRl;

  const access = await loadCaseStructuredAccess(supabase, routeParams.data.caseId, auth.userId);
  if (!access?.isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = RestoreSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const restored = await restoreCaseStructuredVersion(supabase, {
    caseId: routeParams.data.caseId,
    userId: auth.userId,
    versionId: parsed.data.versionId,
  });

  if (!restored) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(restored);
}
