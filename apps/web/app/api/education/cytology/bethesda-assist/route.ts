import { NextResponse } from "next/server";
import { BethesdaAssistInputSchema, interpretBethesdaAssist } from "@repo/cervix-pathology-reference";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `education-cytology-bethesda:${auth.ok ? auth.userId : "dev"}`,
    RL.aiThyroid.limit,
    RL.aiThyroid.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BethesdaAssistInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = interpretBethesdaAssist(parsed.data);
  return NextResponse.json({
    result,
    meta: { assistive: true, domain: "cervix-cytology-bethesda", noPhi: true },
  });
}
