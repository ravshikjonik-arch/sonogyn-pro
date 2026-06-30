import { CreateStructuredReportBodySchema } from "@repo/types";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import {
  generateReportDocumentAsync,
  persistStructuredReport,
  resolveTemplateBySlug,
} from "@/lib/reports/structured-reports-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

/** Create a persisted draft (always saves; unlike generate with preview=true). */
export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "reports-create", RL.reportsWrite);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "reports-create", RL.reportsWrite);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = CreateStructuredReportBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const document = await generateReportDocumentAsync(parsed.data);
    const template = await resolveTemplateBySlug(supabase, parsed.data.templateSlug);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const persistedId = await persistStructuredReport(supabase, auth.userId, document, template.id, {
      patientId: parsed.data.patientId,
      studyId: parsed.data.studyId,
    });

    return NextResponse.json(
      {
        document: { ...document, id: persistedId },
        persistedId,
      },
      { status: 201 },
    );
  } catch (err) {
    safeLog("reports create error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
