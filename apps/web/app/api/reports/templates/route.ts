import { ListReportTemplatesQuerySchema } from "@repo/types";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { listReportTemplates } from "@/lib/reports/structured-reports-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "reports-templates", RL.reportsRead);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  if (auth.ok) {
    const userRl = await rejectIfRateLimitedForUser(auth.userId, "reports-templates", RL.reportsRead);
    if (userRl) return userRl;
  }

  const { searchParams } = new URL(request.url);
  const parsed = ListReportTemplatesQuerySchema.safeParse({
    domain: searchParams.get("domain") ?? undefined,
    locale: searchParams.get("locale") ?? undefined,
    activeOnly: searchParams.get("activeOnly") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const templates = await listReportTemplates(supabase, parsed.data);
    return NextResponse.json({ templates });
  } catch (err) {
    safeLog("reports templates list error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}
