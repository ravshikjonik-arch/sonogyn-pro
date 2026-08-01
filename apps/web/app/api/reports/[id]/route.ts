import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import {
  getStructuredReportById,
  updateStructuredReport,
  UpdateStructuredReportBodySchema,
} from "@/lib/reports/structured-reports-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";
import { resolveDataSupabaseClient } from "@/utils/supabase/user-scoped";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const limited = await rejectIfRateLimitedPreset(request, "reports-detail", RL.reportsRead);
  if (limited) return limited;

  const cookieClient = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, cookieClient);
  const supabase = resolveDataSupabaseClient(request, cookieClient);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "reports-detail", RL.reportsRead);
  if (userRl) return userRl;

  const { id } = await context.params;

  try {
    const result = await getStructuredReportById(supabase, auth.userId, id);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      document: result.document,
      meta: {
        patientId: result.row.patient_id,
        studyId: result.row.study_id,
        templateId: result.row.template_id,
        createdAt: result.row.created_at,
        updatedAt: result.row.updated_at,
        finalizedAt: result.row.finalized_at,
      },
    });
  } catch (err) {
    safeLog("reports get error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const limited = await rejectIfRateLimitedPreset(request, "reports-update", RL.reportsWrite);
  if (limited) return limited;

  const cookieClient = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, cookieClient);
  const supabase = resolveDataSupabaseClient(request, cookieClient);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "reports-update", RL.reportsWrite);
  if (userRl) return userRl;

  const { id } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = UpdateStructuredReportBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await updateStructuredReport(supabase, auth.userId, id, parsed.data);
    if (!result) {
      return NextResponse.json({ error: "Not found or not editable" }, { status: 404 });
    }

    return NextResponse.json({ document: result.document });
  } catch (err) {
    safeLog("reports patch error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
