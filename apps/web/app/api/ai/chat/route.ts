import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/error-handler";
import { userMessageForAiError } from "@/lib/ai/sonogyn-chat/errors";
import { logAiChatEvent } from "@/lib/ai/sonogyn-chat/log-event";
import { resolveLlmProvider } from "@/lib/ai/llm-provider";
import { callOpenRouterChat, type OpenRouterMessage } from "@/lib/ai/sonogyn-chat/openrouter-client";
import { inferClinicalDomain, type SonogynClinicalDomain } from "@/lib/ai/sonogyn-chat/rag-context";
import { SonogynChatRequestSchema } from "@/lib/ai/sonogyn-chat/request-schema";
import { buildSonogynSystemPrompt } from "@/lib/ai/sonogyn-chat/system-prompt";
import { buildEvidenceModeSystemPrompt, formatEvidenceContextForPrompt } from "@/lib/ai/sonogyn-chat/evidence-context";
import { wrapOpenRouterStreamWithEvidence } from "@/lib/ai/sonogyn-chat/stream-client";
import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import { fetchClinicalEvidenceSupplement } from "@/lib/evidence/clinical-evidence-supplement";
import { logEvidenceQuery, sourcesFromAssistantAnswer } from "@/lib/evidence/log-evidence-query";
import { synthesizeWithLlm } from "@/lib/evidence/synthesize-llm";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { detectPhi, PHI_BLOCK_MESSAGE } from "@/lib/security/phi-detection";
import { safeLog } from "@/lib/security/safeLog";
import { searchEvidenceUnified } from "@repo/evidence-retrieval";
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
  if (hasImages) {
    return (
      resolveLlmProvider("vision")?.model ||
      process.env.OPENROUTER_US_VISION_MODEL?.trim() ||
      process.env.OPENROUTER_ORADS_MODEL?.trim() ||
      "openai/gpt-4o-mini"
    );
  }
  // Клиентский model (часто openrouter id) не подставляем в Perplexity.
  const llm = resolveLlmProvider("text");
  if (llm?.provider === "perplexity") return llm.model;
  if (requested?.trim()) return requested.trim();
  return llm?.model || process.env.OPENROUTER_ORADS_MODEL?.trim() || "openai/gpt-4o-mini";
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

  const chatRl = await consumeRateLimit(
    `ai-chat:${auth.userId}`,
    RL.aiChat.limit,
    RL.aiChat.windowMs,
  );
  if (!chatRl.ok) {
    return NextResponse.json(
      { error: userMessageForAiError("rate_limit"), code: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(chatRl.retryAfterSec) } },
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

  const { messages, model, stream, images, modality, mode, includeEvidence } = parsed.data;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUser?.content ?? "";
  const phiCheck = detectPhi(messages.map((message) => message.content).join("\n"));
  if (!phiCheck.ok) {
    safeLog("ai chat phi blocked", { reasons: phiCheck.reasons, userId: auth.userId });
    return NextResponse.json(
      { error: PHI_BLOCK_MESSAGE, code: "phi_detected" },
      { status: 400 },
    );
  }
  const domain = mode === "evidence" ? "general" : resolveDomain(modality, lastUserText);
  const hasImages = Boolean(images?.length);

  if (mode === "evidence") {
    const rl = await consumeRateLimit(
      `ai-chat-evidence:${auth.userId}`,
      RL.aiChatEvidence.limit,
      RL.aiChatEvidence.windowMs,
    );
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Слишком много EBM-запросов. Подождите.", code: "rate_limit" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }
    if (hasImages) {
      return NextResponse.json(
        { error: "Evidence mode не поддерживает изображения — используйте текстовый вопрос.", code: "invalid_request" },
        { status: 400 },
      );
    }
    if (lastUserText.trim().length < 3) {
      return NextResponse.json(
        { error: "Укажите клинический вопрос (мин. 3 символа).", code: "invalid_request" },
        { status: 400 },
      );
    }
  }

  const llm = resolveLlmProvider(hasImages ? "vision" : "text");
  if (!llm) {
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
      {
        error:
          "AI не настроен: задайте PERPLEXITY_API_KEY (текст) и/или OPENROUTER_API_KEY (vision) на Vercel.",
        code: "config",
      },
      { status: 503 },
    );
  }
  if (hasImages && llm.provider !== "openrouter") {
    return NextResponse.json(
      {
        error: "Анализ изображений требует OPENROUTER_API_KEY (vision). Текст может идти через Perplexity.",
        code: "config",
      },
      { status: 503 },
    );
  }

  let evidenceAnswer: Awaited<ReturnType<typeof synthesizeWithLlm>> | null = null;

  let systemPrompt =
    mode === "evidence"
      ? ""
      : buildSonogynSystemPrompt({
          domain,
          userText: lastUserText,
          hasImages,
        });

  const clinicalHintsEnabled =
    mode === "clinical" &&
    !hasImages &&
    lastUserText.trim().length >= 5 &&
    (includeEvidence === true ||
      (includeEvidence !== false && process.env.EVIDENCE_CLINICAL_HINTS === "1"));

  if (clinicalHintsEnabled) {
    const supplement = await fetchClinicalEvidenceSupplement(lastUserText);
    if (supplement) {
      systemPrompt = [
        systemPrompt,
        "",
        "---",
        "Дополнительный EBM-контекст (PubMed, КР, WHO/NICE — цитируй при необходимости, не выдумывай источники):",
        supplement,
      ].join("\n");
    }
  }

  if (mode === "evidence") {
    const config = await buildRetrievalConfigAsync();
    const searchResult = await searchEvidenceUnified(
      { query: lastUserText, limit: 20, preferHighEvidence: true, maxAgeYears: 10 },
      { config },
    );
    evidenceAnswer = await synthesizeWithLlm(lastUserText, searchResult);
    systemPrompt = buildEvidenceModeSystemPrompt(formatEvidenceContextForPrompt(evidenceAnswer));
    void logEvidenceQuery(supabase, {
      userId: auth.userId,
      query: lastUserText,
      sources: sourcesFromAssistantAnswer(evidenceAnswer),
      resultCount: evidenceAnswer.citations.length,
      synthesisMode: `chat-${evidenceAnswer.synthesisMode}`,
      evidenceStrength: evidenceAnswer.evidenceStrength,
    });
  }

  const providerMessages = buildProviderMessages({
    history: messages,
    images,
    systemPrompt,
  });

  const selectedModel = selectModel(hasImages, model);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  const result = await callOpenRouterChat({
    apiKey: llm.apiKey,
    url: llm.url,
    appUrl,
    body: {
      model: selectedModel,
      messages: providerMessages,
      stream,
      max_tokens: 4096,
    },
  });

  if (!result.ok) {
    safeLog("ai chat provider error", {
      status: result.status,
      code: result.code,
      provider: llm.provider,
      userId: auth.userId,
    });
    await logAiChatEvent({
      userId: auth.userId,
      domain,
      success: false,
      durationMs: Date.now() - started,
      model: `${llm.provider}:${selectedModel}`,
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
    model: `${llm.provider}:${selectedModel}`,
    hasImages,
  });

  if (stream) {
    const body = result.response.body;
    if (!body) {
      return NextResponse.json({ error: "Empty stream" }, { status: 502 });
    }

    const streamBody =
      evidenceAnswer != null ? wrapOpenRouterStreamWithEvidence(body, evidenceAnswer) : body;

    return new NextResponse(streamBody, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const data = await result.response.json();
    if (evidenceAnswer) {
      return NextResponse.json({ ...data, evidence: evidenceAnswer, mode: "evidence" });
    }
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 500, { route: "POST /api/ai/chat", channel: "ai-chat" });
  }
}
