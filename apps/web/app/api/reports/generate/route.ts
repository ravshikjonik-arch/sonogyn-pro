import { GenerateStructuredReportRequestSchema } from "@repo/types";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import {
  generateReportDocument,
  persistStructuredReport,
  resolveTemplateBySlug,
} from "@/lib/reports/structured-reports-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "reports-generate", RL.reportsGenerate);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  if (auth.ok) {
    const userRl = await rejectIfRateLimitedForUser(auth.userId, "reports-generate", RL.reportsGenerate);
    if (userRl) return userRl;
  }

  const json = await request.json().catch(() => null);
  const parsed = GenerateStructuredReportRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const document = generateReportDocument(parsed.data);

    if (parsed.data.preview || !auth.ok) {
      return NextResponse.json({
        document,
        persistedId: undefined,
      });
    }

    const template = await resolveTemplateBySlug(supabase, parsed.data.templateSlug);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const persistedId = await persistStructuredReport(supabase, auth.userId, document, template.id);

    return NextResponse.json({
      document: { ...document, id: persistedId },
      persistedId,
    });
  } catch (err) {
    safeLog("reports generate error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "Generation failed";
    const status = message.includes("Unsupported report domain") ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
