import { z } from "zod";
import {
  CpiCaseInputSchema,
  evaluateCpiCase,
  generateCpiReport,
  SupabaseCpiRepository,
} from "@repo/cervical-pathology";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  format: z.enum(["html", "pdf", "docx"]),
  input: CpiCaseInputSchema,
  caseId: z.string().uuid().optional(),
  persist: z.boolean().optional(),
});

/** POST /api/cpi/reports — generate HTML/PDF/DOCX report. */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const evaluation = evaluateCpiCase(parsed.data.input);
  const report = generateCpiReport(parsed.data.format, parsed.data.input, evaluation);

  if (parsed.data.persist && parsed.data.caseId) {
    const supabase = await createClient();
    const auth = await requireSupabaseUserFromRequest(request, supabase);
    if (auth.ok) {
      const repo = new SupabaseCpiRepository(supabase);
      const content =
        typeof report.body === "string" ? report.body : report.body.toString("base64");
      await repo.saveReport(parsed.data.caseId, parsed.data.format, content);
    } else if (!isDevSkipAuthEnabled()) {
      return auth.response;
    }
  }

  if (typeof report.body === "string") {
    return new NextResponse(report.body, {
      headers: {
        "Content-Type": report.mimeType,
        "Content-Disposition": `attachment; filename="${report.filename}"`,
      },
    });
  }

  return new NextResponse(new Uint8Array(report.body), {
    headers: {
      "Content-Type": report.mimeType,
      "Content-Disposition": `attachment; filename="${report.filename}"`,
    },
  });
}
