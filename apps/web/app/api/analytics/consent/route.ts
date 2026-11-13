import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  value: z.enum(["granted", "denied"]),
});

/**
 * Аудит выбора cookie-consent → `analytics_events` (без ПДн и без IP в properties).
 */
export async function POST(req: Request) {
  const key = rateLimitKeyFromRequest(req, "analytics-consent");
  const rl = await consumeRateLimit(key, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event_name: "analytics_consent",
      properties: {
        value: parsed.data.value,
        source: "cookie_banner",
      },
    });
  } catch {
    /* таблица/RLS — не блокируем UX */
  }

  return NextResponse.json({ ok: true });
}
