import { NextResponse } from "next/server";

import { ChatCompletionRequestSchema } from "@repo/types";

import { handleApiError } from "@/lib/api/error-handler";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ChatCompletionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return handleApiError(parsed.error.flatten(), 400, { route: "POST /api/ai/chat", channel: "ai-chat" });
  }

  const { messages, model, stream } = parsed.data;

  if (!process.env.OPENROUTER_API_KEY) {
    return handleApiError(new Error("OpenRouter API key not configured"), 500, { route: "POST /api/ai/chat", channel: "ai-chat" });
  }

  const openRouterUrl = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";

  try {
    const response = await fetch(openRouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
        "X-Title": "Sonogyn AI",
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_ORADS_MODEL || "openai/gpt-4o-mini",
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return handleApiError(new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`), response.status, { route: "POST /api/ai/chat", channel: "ai-chat" });
    }

    if (stream) {
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    } else {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    return handleApiError(error, 500, { route: "POST /api/ai/chat", channel: "ai-chat" });
  }
}
