import { CpiCaseInputSchema, evaluateCpiCase } from "@repo/cervical-pathology";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { isE2eFixturesEnabled } from "@/lib/e2e/ci-stub";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/** POST /api/cpi/evaluate — stateless CDS + risk (auth + rate limit). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  const userId =
    auth.ok || (process.env.NODE_ENV !== "production" && isE2eFixturesEnabled())
      ? (auth.ok ? auth.userId : "e2e-user-id")
      : null;
  if (!userId) {
    if (isDevSkipAuthEnabled()) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `cpi-evaluate:${userId}`,
    RL.copilotCdsPreview.limit,
    RL.copilotCdsPreview.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите минуту.", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = CpiCaseInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const evaluation = evaluateCpiCase(parsed.data);
  return NextResponse.json({ evaluation });
}
