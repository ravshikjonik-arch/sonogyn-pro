import { NextResponse } from "next/server";
import { z } from "zod";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const OradsAiBodySchema = z.object({
  payload: z.record(z.unknown()),
});

const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions";

function buildPrompt(payload: Record<string, unknown>): string {
  return `Ты радиолог. Оцени O-RADS по признакам и дай краткий ответ на русском.
Формат: "AI предполагает O-RADS [X] с уверенностью [Y]%. Основание: [кратко]".
Данные: ${JSON.stringify(payload)}`;
}

/**
 * Server-side O-RADS AI proxy — ключ OpenRouter только на сервере.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const userKey = auth.ok ? auth.userId : "dev";
  const burstRl = await consumeRateLimit(
    `ai-orads-burst:${userKey}`,
    RL.aiOradsBurst.limit,
    RL.aiOradsBurst.windowMs,
  );
  if (!burstRl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(burstRl.retryAfterSec) } },
    );
  }
  const rl = await consumeRateLimit(`ai-orads:${userKey}`, RL.aiOrads.limit, RL.aiOrads.windowMs);
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

  const parsed = OradsAiBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({
      text: "AI предполагает O-RADS 3 с уверенностью 72%. Основание: демо-режим — задайте OPENROUTER_API_KEY на сервере.",
      meta: { pipeline: "orads-mock", assistive: true },
    });
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_ORADS_MODEL?.trim() || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "Ты медицинский ассистент по O-RADS. Ответ краткий, на русском." },
        { role: "user", content: buildPrompt(parsed.data.payload) },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `AI provider error ${res.status}` }, { status: 502 });
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
  }

  return NextResponse.json({
    text,
    meta: { pipeline: "orads-proxy-v1", assistive: true },
  });
}
