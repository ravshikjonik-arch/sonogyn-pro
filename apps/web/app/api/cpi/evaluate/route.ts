import { CpiCaseInputSchema, evaluateCpiCase } from "@repo/cervical-pathology";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/** POST /api/cpi/evaluate — stateless CDS + risk (no persistence). */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = CpiCaseInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const evaluation = evaluateCpiCase(parsed.data);
  return NextResponse.json({ evaluation });
}
