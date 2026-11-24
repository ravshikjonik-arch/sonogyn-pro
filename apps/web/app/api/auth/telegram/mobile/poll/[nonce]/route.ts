import { NextResponse } from "next/server";
import { z } from "zod";

import { pollTelegramMobileLoginPending } from "@/lib/auth/telegram-mobile-login-pending";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";

const ParamSchema = z.object({ nonce: z.string().uuid() });

type Params = { params: Promise<{ nonce: string }> };

/** GET — статус nonce (pending | ok | expired). */
export async function GET(request: Request, { params }: Params) {
  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(request, "auth-telegram-mobile-poll"),
    RL.authTelegram.limit,
    RL.authTelegram.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const { nonce: raw } = await params;
  const parsed = ParamSchema.safeParse({ nonce: raw });
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный nonce." }, { status: 400 });
  }

  try {
    const poll = await pollTelegramMobileLoginPending(parsed.data.nonce);
    if (poll.status === "expired") {
      return NextResponse.json({ status: "expired" }, { status: 404 });
    }
    if (poll.status === "ok") {
      return NextResponse.json({ status: "ok", payload: poll.payload, nonce: poll.nonce });
    }
    return NextResponse.json({ status: "pending" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}