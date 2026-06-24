import { SupabaseCpiRepository } from "@repo/cervical-pathology";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type Params = { params: Promise<{ caseId: string }> };

/** GET /api/cpi/cases/[caseId] */
export async function GET(request: Request, { params }: Params) {
  const { caseId } = await params;
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) {
    if (isDevSkipAuthEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return auth.response;
  }

  const repo = new SupabaseCpiRepository(supabase);
  const record = await repo.getCase(auth.userId, caseId);
  if (!record) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ case: record });
}
