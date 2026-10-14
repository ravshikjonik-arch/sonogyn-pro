import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCaseStructuredDocument,
  loadCaseStructuredAccess,
  upsertCaseStructuredDocument,
} from "@/lib/structured-editor/case-structured-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });

export async function GET(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-structured-read", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-structured-read", RL.casesListUser);
  if (userRl) return userRl;

  const access = await loadCaseStructuredAccess(supabase, routeParams.data.caseId, auth.userId);
  if (!access?.canRead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { document, updatedAt } = await getCaseStructuredDocument(supabase, routeParams.data.caseId);
    return NextResponse.json({
      document,
      updatedAt,
      canEdit: access.isOwner,
    });
  } catch (err) {
    safeLog("case structured get error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Не удалось загрузить документ" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-structured-write", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-structured-write", RL.casesListUser);
  if (userRl) return userRl;

  const access = await loadCaseStructuredAccess(supabase, routeParams.data.caseId, auth.userId);
  if (!access?.isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  try {
    const result = await upsertCaseStructuredDocument(supabase, {
      caseId: routeParams.data.caseId,
      userId: auth.userId,
      body,
    });

    if (!result.ok && result.conflict) {
      return NextResponse.json({ error: "conflict", code: "CONFLICT" }, { status: 409 });
    }
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      document: result.document,
      updatedAt: result.updatedAt,
      versionNumber: result.versionNumber,
    });
  } catch (err) {
    safeLog("case structured put error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}
