import { NextResponse } from "next/server";
import { TutorRequestSchema, TutorResponseSchema } from "@repo/ai-tutor";

import { orchestrateTutorExplain } from "@/lib/ai/tutor/orchestrate";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { detectPhiInUnknown, PHI_BLOCK_MESSAGE } from "@/lib/security/phi-detection";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const userKey = auth.ok ? auth.userId : "dev";
  const rl = await consumeRateLimit(`ai-tutor:${userKey}`, RL.aiTutor.limit, RL.aiTutor.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов к AI Tutor." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TutorRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tutor payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.mode !== "explain") {
    return NextResponse.json(
      {
        error: `Режим «${parsed.data.mode}» будет в T2.5. Сейчас доступен только Explain.`,
        code: "mode_not_implemented",
      },
      { status: 501 },
    );
  }

  const phiCheck = detectPhiInUnknown(parsed.data.question);
  if (!phiCheck.ok) {
    safeLog("ai tutor phi blocked", { reasons: phiCheck.reasons, userId: userKey });
    return NextResponse.json({ error: PHI_BLOCK_MESSAGE, code: "phi_detected" }, { status: 400 });
  }

  try {
    const response = await orchestrateTutorExplain({
      question: parsed.data.question,
      level: parsed.data.level,
      deepen: Boolean(parsed.data.deepen),
    });
    const validated = TutorResponseSchema.safeParse(response);
    if (!validated.success) {
      return NextResponse.json({ error: "Tutor response validation failed" }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    safeLog("ai tutor error", {
      message: error instanceof Error ? error.message : "unknown",
      userId: userKey,
    });
    return NextResponse.json({ error: "AI Tutor временно недоступен" }, { status: 502 });
  }
}
