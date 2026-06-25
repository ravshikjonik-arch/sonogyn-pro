import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/error-handler";
import { userMessageForAiError } from "@/lib/ai/sonogyn-chat/errors";
import { logAiChatEvent } from "@/lib/ai/sonogyn-chat/log-event";
import { callOpenRouterChat, type OpenRouterMessage } from "@/lib/ai/sonogyn-chat/openrouter-client";
import { inferClinicalDomain, type SonogynClinicalDomain } from "@/lib/ai/sonogyn-chat/rag-context";
import { SonogynChatRequestSchema } from "@/lib/ai/sonogyn-chat/request-schema";
import { buildSonogynSystemPrompt } from "@/lib/ai/sonogyn-chat/system-prompt";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

function resolveDomain(
  modality: string | undefined,
  lastUserText: string,
): SonogynClinicalDomain {
  if (modality && modality !== "auto") {
    return modality as SonogynClinicalDomain;
  }
  return inferClinicalDomain(lastUserText);
}

function buildProviderMessages(params: {
  history: { role: string; content: string }[];
  images?: { mediaType: string; data: string }[];
  systemPrompt: string;
}): OpenRouterMessage[] {
  const out: OpenRouterMessage[] = [{ role: "system", content: params.systemPrompt }];

  for (let i = 0; i < params.history.length; i++) {
    const msg = params.history[i]!;
    const isLastUser = i === params.history.length - 1 && msg.role === "user";

    if (isLastUser && params.images?.length) {
      const parts: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      > = [];
      for (const img of params.images) {
        parts.push({
          type: "image_url",
          image_url: { url: `data:${img.mediaType};base64,${img.data}` },
        });
      }
      parts.push({ type: "text", text: msg.content });
      out.push({ role: "user", content: parts });
    } else {
      out.push({ role: msg.role, content: msg.content });
    }
  }

  return out;
}

function selectModel(hasImages: boolean, requested?: string): string {
  if (requested?.trim()) return requested.trim();
  if (hasImages) {
    return (
      process.env.OPENROUTER_US_VISION_MODEL?.trim() ||
      process.env.OPENROUTER_ORADS_MODEL?.trim() ||
      "openai/gpt-4o-mini"
    );
  }
  return process.env.OPENROUTER_ORADS_MODEL?.trim() || "openai/gpt-4o-mini";
}

export async function POST(request: Request) {
  const started = Date.now();
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) {
    return NextResponse.json(
      { error: userMessageForAiError("auth"), code: "auth" },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: userMessageForAiError("invalid_request"), code: "invalid_request" },
      { status: 400 },
    );
  }

  const parsed = SonogynChatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: userMessageForAiError("invalid_request"), code: "invalid_request" },
      { status: 400 },
    );
  }

  const { messages, model, stream, images, modality } = parsed.data;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUser?.content ?? "";
  const domain = resolveDomain(modality, lastUserText);
  const hasImages = Boolean(images?.length);

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    await logAiChatEvent({
      userId: auth.userId,
      domain,
      success: false,
      durationMs: Date.now() - started,
      model: "none",
      errorCode: "config",
      hasImages,
    });
    return NextResponse.json(
      { error: userMessageForAiError("config"), code: "config" },
      { status: 503 },
    );
  }

  const systemPrompt = buildSonogynSystemPrompt({
    domain,
    userText: lastUserText,
    hasImages,
  });

  const providerMessages = buildProviderMessages({
    history: messages,
    images,
    systemPrompt,
  });

  const selectedModel = selectModel(hasImages, model);
  const openRouterUrl = process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  const result = await callOpenRouterChat({
    apiKey,
    url: openRouterUrl,
    appUrl,
    body: {
      model: selectedModel,
      messages: providerMessages,
      stream,
      max_tokens: 4096,
    },
  });

  if (!result.ok) {
    console.error("[POST /api/ai/chat] OpenRouter error", {
      status: result.status,
      code: result.code,
      body: result.bodyText.slice(0, 500),
      userId: auth.userId,
    });
    await logAiChatEvent({
      userId: auth.userId,
      domain,
      success: false,
      durationMs: Date.now() - started,
      model: selectedModel,
      errorCode: result.code,
      hasImages,
    });
    return NextResponse.json(
      { error: userMessageForAiError(result.code), code: result.code },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  await logAiChatEvent({
    userId: auth.userId,
    domain,
    success: true,
    durationMs: Date.now() - started,
    model: selectedModel,
    hasImages,
  });

  if (stream) {
    return new NextResponse(result.response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const data = await result.response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 500, { route: "POST /api/ai/chat", channel: "ai-chat" });
  }
}
