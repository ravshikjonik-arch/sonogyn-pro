import { CpiCaseInputSchema, SupabaseCpiRepository } from "@repo/cervical-pathology";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/** GET /api/cpi/cases — list user CPI cases. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) {
    if (isDevSkipAuthEnabled()) return NextResponse.json({ cases: [] });
    return auth.response;
  }

  const repo = new SupabaseCpiRepository(supabase);
  const cases = await repo.listCases(auth.userId);
  return NextResponse.json({ cases });
}

/** POST /api/cpi/cases — create + evaluate + persist. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) {
    if (isDevSkipAuthEnabled()) {
      return NextResponse.json({ error: "Auth required to persist cases" }, { status: 401 });
    }
    return auth.response;
  }

  const json = await request.json().catch(() => null);
  const parsed = CpiCaseInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const repo = new SupabaseCpiRepository(supabase);
    const result = await repo.createAndEvaluate(auth.userId, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
