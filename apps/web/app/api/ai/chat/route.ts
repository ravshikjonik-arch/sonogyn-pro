import { NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError } from "@/lib/api/error-handler";
import { userMessageForAiError } from "@/lib/ai/sonogyn-chat/errors";
import {
  appendChatMessage,
  createChatSession,
  touchChatSession,
} from "@/lib/ai/sonogyn-chat/chat-sessions";
import {
  assertAiGatewayQuota,
  estimateGatewayCostUsd,
  hasAnyLlmConfigured,
  resolveLlmProvider,
  resolveProviderChain,
  type GatewayProviderId,
} from "@/lib/ai/gateway";
import { logAiChatEvent } from "@/lib/ai/sonogyn-chat/log-event";
import {
  buildGatewayAttemptChain,
  CLOUD_PROVIDER_ATTEMPT_TIMEOUT_MS,
  LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS,
  shouldFailoverToNextProvider,
} from "@/lib/ai/sonogyn-chat/model-fallback";
import { isAiSdkEnabled } from "@/lib/ai/sdk/flags";
import { aiSdkTextStreamResponse, runAiSdkStreamText } from "@/lib/ai/sdk/stream-chat";
import { callOpenRouterChat, type OpenRouterMessage } from "@/lib/ai/sonogyn-chat/openrouter-client";
import { inferClinicalDomain, type SonogynClinicalDomain } from "@/lib/ai/sonogyn-chat/rag-context";
import { SonogynChatRequestSchema } from "@/lib/ai/sonogyn-chat/request-schema";
import { buildSonogynSystemPrompt } from "@/lib/ai/sonogyn-chat/system-prompt";
import { buildEvidenceModeSystemPrompt, formatEvidenceContextForPrompt } from "@/lib/ai/sonogyn-chat/evidence-context";
import {
  formatInsufficientEvidenceChatReply,
  isInsufficientEvidence,
} from "@/lib/ai/sonogyn-chat/evidence-insufficient";
import {
  formatEvidenceSourcedChatReply,
  isEvidenceChatSinglePassEnabled,
  postValidateEvidenceAnswer,
} from "@/lib/ai/sonogyn-chat/evidence-answer-validate";
import { evidenceCostModelLabel } from "@/lib/ai/sonogyn-chat/evidence-cost";
import {
  createStaticEvidenceChatStream,
  wrapOpenRouterStreamWithEvidence,
} from "@/lib/ai/sonogyn-chat/stream-client";
import { extractToolsFromAssistantText } from "@/lib/ai/sonogyn-chat/tool-results";
import {
  detectPromptInjection,
  PROMPT_INJECTION_BLOCK_MESSAGE,
} from "@/lib/ai/sonogyn-chat/security/prompt-injection";
import { redactForAiLog } from "@/lib/ai/sonogyn-chat/security/redact-log";
import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import { fetchClinicalEvidenceSupplement } from "@/lib/evidence/clinical-evidence-supplement";
import { logEvidenceQuery, sourcesFromAssistantAnswer } from "@/lib/evidence/log-evidence-query";
import { synthesizeWithLlm } from "@/lib/evidence/synthesize-llm";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser, requireSupabaseUserOrOpenAccess } from "@/lib/security/require-user";
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

async function ensureSessionId(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  sessionId?: string;
  title: string;
  domain: string;
}): Promise<string | null> {
  if (params.sessionId) return params.sessionId;
  const created = await createChatSession(params.supabase, {
    userId: params.userId,
    title: params.title,
    domain: params.domain,
  });
  return created?.id ?? null;
}

export async function POST(request: Request) {
  const started = Date.now();
  const supabase = await createClient();
  const auth = await requireSupabaseUserOrOpenAccess(request, supabase);
  if (!auth.ok) {
    return NextResponse.json(
      { error: userMessageForAiError("auth"), code: "auth" },
      { status: 401 },
    );
  }
  const persistChat = !auth.openAccess;

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

  const { messages, model, stream, images, modality, mode, includeEvidence, sessionId, retry } =
    parsed.data;

  if (!persistChat && mode !== "evidence") {
    return NextResponse.json(
      {
        error: "Клинический чат доступен после входа. Режим EBM (Evidence) — без регистрации.",
        code: "auth",
      },
      { status: 401 },
    );
  }

  if (persistChat) {
    const quota = await assertAiGatewayQuota(auth.userId);
    if (!quota.ok) {
      const error =
        quota.reason === "monthly_chat"
          ? "Достигнут лимит бесплатных AI-запросов. Перейдите на PRO."
          : quota.reason === "daily_usd"
            ? `Дневной лимит стоимости AI (~$${quota.usedUsd}/$${quota.usdLimit}).`
            : `Дневной лимит запросов AI (${quota.usedRequests}/${quota.requestLimit}).`;
      return NextResponse.json(
        {
          error,
          code: "quota_exceeded",
          used: quota.monthlyUsed ?? quota.usedRequests,
          limit: quota.monthlyLimit ?? quota.requestLimit,
          quota,
        },
        { status: 402 },
      );
    }
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUser?.content ?? "";

  const injection = detectPromptInjection(lastUserText);
  if (!injection.ok) {
    safeLog("ai chat injection blocked", {
      userId: auth.userId,
      reasons: injection.reasons,
    });
    return NextResponse.json(
      { error: PROMPT_INJECTION_BLOCK_MESSAGE, code: "prompt_injection" },
      { status: 400 },
    );
  }

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
  const useStream = stream && !hasImages;
  /** Clinical engines are attached only on the AI SDK streaming path; the prompt must say so. */
  const toolsAvailable = useStream && isAiSdkEnabled() && mode === "clinical" && !hasImages;

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
        {
          error: "Evidence mode не поддерживает изображения — используйте текстовый вопрос.",
          code: "invalid_request",
        },
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

  const llmPurpose = hasImages ? "vision" : mode === "evidence" ? "evidence" : "text";
  const providerChain = resolveProviderChain(llmPurpose);
  const llm = providerChain[0] ?? resolveLlmProvider(llmPurpose);
  const gatewayConfigured = hasAnyLlmConfigured() || providerChain.length > 0;
  if (!gatewayConfigured && mode !== "evidence") {
    if (persistChat) {
      await logAiChatEvent({
        userId: auth.userId,
        domain,
        success: false,
        durationMs: Date.now() - started,
        model: "none",
        errorCode: "config",
        hasImages,
        sessionId,
      });
    }
    return NextResponse.json(
      {
        error:
          "AI не настроен: Colibri (локально) и/или PERPLEXITY_API_KEY / OPENROUTER_API_KEY. См. /api/ai/gateway/status",
        code: "config",
      },
      { status: 503 },
    );
  }
  if (hasImages) {
    const visionOk = providerChain.some(
      (p) => p.provider === "openrouter" || (p.provider === "colibri" && Boolean(process.env.COLIBRI_VISION_MODEL?.trim())),
    );
    if (!visionOk) {
      return NextResponse.json(
        {
          error:
            "Анализ изображений: нужен OPENROUTER_API_KEY или COLIBRI_VISION_MODEL. Текст — через Colibri/Perplexity.",
          code: "config",
        },
        { status: 503 },
      );
    }
  }

  let evidenceAnswer: Awaited<ReturnType<typeof synthesizeWithLlm>> | null = null;
  let promptVersion = "evidence-v1";

  let systemPrompt =
    mode === "evidence"
      ? ""
      : buildSonogynSystemPrompt({
          domain,
          userText: lastUserText,
          hasImages,
          toolsAvailable,
        }).prompt;

  if (mode === "clinical") {
    promptVersion = buildSonogynSystemPrompt({
      domain,
      userText: lastUserText,
      hasImages,
      toolsAvailable,
    }).promptVersion;
  }

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
    systemPrompt = buildEvidenceModeSystemPrompt(
      formatEvidenceContextForPrompt(evidenceAnswer),
      lastUserText,
    );
    promptVersion = "evidence-v2";
    if (persistChat) {
      void logEvidenceQuery(supabase, {
        userId: auth.userId,
        query: lastUserText,
        sources: sourcesFromAssistantAnswer(evidenceAnswer),
        resultCount: evidenceAnswer.citations.length,
        synthesisMode: `chat-${evidenceAnswer.synthesisMode}`,
        evidenceStrength: evidenceAnswer.evidenceStrength,
      });
    }
  }

  const activeSessionId = persistChat
    ? await ensureSessionId({
        supabase,
        userId: auth.userId,
        sessionId,
        title: lastUserText.slice(0, 60) || "Новый чат",
        domain,
      })
    : null;

  if (persistChat && activeSessionId && !retry) {
    await appendChatMessage(supabase, {
      sessionId: activeSessionId,
      userId: auth.userId,
      role: "user",
      content: lastUserText,
    });
  }

  if (mode === "evidence" && evidenceAnswer && isInsufficientEvidence(evidenceAnswer)) {
    const assistantText = formatInsufficientEvidenceChatReply(evidenceAnswer);
    promptVersion = "evidence-insufficient-v1";

    if (persistChat && activeSessionId) {
      await appendChatMessage(supabase, {
        sessionId: activeSessionId,
        userId: auth.userId,
        role: "assistant",
        content: assistantText,
        evidence: evidenceAnswer,
        isAiDraft: true,
        modelId: "retrieval-only",
        promptVersion,
      });
    }

    if (persistChat) {
      await logAiChatEvent({
        userId: auth.userId,
        domain,
        success: true,
        durationMs: Date.now() - started,
        model: "evidence:insufficient:llmCalls=0",
        hasImages: false,
        promptVersion,
        sessionId: activeSessionId,
      });
    }

    if (useStream) {
      return new NextResponse(createStaticEvidenceChatStream(assistantText, evidenceAnswer), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Sonogyn-Prompt-Version": promptVersion,
          "X-Sonogyn-Session-Id": activeSessionId ?? "",
          "X-Sonogyn-Evidence-Llm-Calls": "0",
        },
      });
    }

    return NextResponse.json({
      choices: [{ message: { role: "assistant", content: assistantText } }],
      evidence: evidenceAnswer,
      mode: "evidence",
      sessionId: activeSessionId,
      promptVersion,
      isAiDraft: true,
      evidenceMeta: { llmCalls: 0, singlePass: true },
    });
  }

  // P1+P2: Evidence single-pass — structured answer + citation validation, no second narrative LLM.
  if (
    mode === "evidence" &&
    evidenceAnswer &&
    isEvidenceChatSinglePassEnabled() &&
    !isInsufficientEvidence(evidenceAnswer)
  ) {
    const drafted = formatEvidenceSourcedChatReply(evidenceAnswer);
    const validated = postValidateEvidenceAnswer(drafted, evidenceAnswer);
    const assistantText = validated.text;
    promptVersion = validated.replaced
      ? "evidence-single-pass-validated-fallback-v1"
      : "evidence-single-pass-v1";
    // synthesisMode llm ⇒ 1 call in synthesizeWithLlm; rules ⇒ 0
    const llmCalls = evidenceAnswer.synthesisMode === "llm" ? 1 : 0;

    if (persistChat && activeSessionId) {
      await appendChatMessage(supabase, {
        sessionId: activeSessionId,
        userId: auth.userId,
        role: "assistant",
        content: assistantText,
        evidence: evidenceAnswer,
        isAiDraft: true,
        modelId: `evidence:single-pass:${evidenceAnswer.synthesisMode}`,
        promptVersion,
      });
    }

    if (persistChat) {
      await logAiChatEvent({
        userId: auth.userId,
        domain,
        success: true,
        durationMs: Date.now() - started,
        model: evidenceCostModelLabel({
          llmCalls,
          singlePass: true,
          synthesisMode: evidenceAnswer.synthesisMode,
        }),
        hasImages: false,
        promptVersion,
        sessionId: activeSessionId,
      });
    }

    if (useStream) {
      return new NextResponse(createStaticEvidenceChatStream(assistantText, evidenceAnswer), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Sonogyn-Prompt-Version": promptVersion,
          "X-Sonogyn-Session-Id": activeSessionId ?? "",
          "X-Sonogyn-Evidence-Llm-Calls": String(llmCalls),
          "X-Sonogyn-Evidence-Validated": validated.ok ? "1" : "0",
        },
      });
    }

    return NextResponse.json({
      choices: [{ message: { role: "assistant", content: assistantText } }],
      evidence: evidenceAnswer,
      mode: "evidence",
      sessionId: activeSessionId,
      promptVersion,
      isAiDraft: true,
      evidenceMeta: {
        llmCalls,
        singlePass: true,
        validated: validated.ok,
        replaced: validated.replaced,
        reasons: validated.reasons,
      },
    });
  }

  if (mode === "evidence" && evidenceAnswer && !llm) {
    const drafted = formatEvidenceSourcedChatReply(evidenceAnswer);
    const validated = postValidateEvidenceAnswer(drafted, evidenceAnswer);
    const assistantText = validated.text;
    promptVersion = "evidence-retrieval-v1";

    if (useStream) {
      return new NextResponse(createStaticEvidenceChatStream(assistantText, evidenceAnswer), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Sonogyn-Prompt-Version": promptVersion,
          "X-Sonogyn-Session-Id": "",
          "X-Sonogyn-Evidence-Llm-Calls": "0",
        },
      });
    }

    return NextResponse.json({
      choices: [{ message: { role: "assistant", content: assistantText } }],
      evidence: evidenceAnswer,
      mode: "evidence",
      sessionId: null,
      promptVersion,
      isAiDraft: true,
      evidenceMeta: { llmCalls: 0, singlePass: true },
    });
  }

  if (!llm) {
    return NextResponse.json(
      {
        error:
          "AI не настроен: Colibri / PERPLEXITY_API_KEY / OPENROUTER_API_KEY для режима Evidence.",
        code: "config",
      },
      { status: 503 },
    );
  }

  const modelChain = buildGatewayAttemptChain(llmPurpose, model);
  const selectedModel = modelChain[0]?.modelId ?? model ?? llm.model;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const enableTools = mode === "clinical" && !hasImages;

  const logSuccess = async (opts: {
    modelLabel: string;
    promptTokens?: number | null;
    completionTokens?: number | null;
    usedFallback?: boolean;
    provider?: GatewayProviderId | string;
  }) => {
    if (!persistChat) return;
    const provider = (opts.provider ?? llm.provider) as GatewayProviderId;
    await logAiChatEvent({
      userId: auth.userId,
      domain,
      success: true,
      durationMs: Date.now() - started,
      model: opts.usedFallback ? `${opts.modelLabel}:fallback` : opts.modelLabel,
      hasImages,
      promptVersion,
      estimatedCostUsd: estimateGatewayCostUsd(provider, opts.promptTokens, opts.completionTokens),
      sessionId: activeSessionId,
    });
    if (activeSessionId) {
      await touchChatSession(supabase, activeSessionId, auth.userId, {
        model_id: opts.modelLabel,
        prompt_version: promptVersion,
      });
    }
  };

  if (useStream && isAiSdkEnabled() && mode !== "evidence") {
    let lastError: unknown;
    for (let i = 0; i < modelChain.length; i++) {
      const attempt = modelChain[i]!;
      if (!attempt.apiKey || !attempt.url) continue;
      // AI SDK path today is OpenRouter/Perplexity-shaped; skip pure local if SDK not wired for Colibri
      const attemptLlm = {
        provider: attempt.provider as GatewayProviderId,
        apiKey: attempt.apiKey,
        url: attempt.url,
        model: attempt.modelId,
        isLocal: attempt.isLocal,
      };
      try {
        const { result, collectedTools } = runAiSdkStreamText({
          llm: attemptLlm,
          modelId: attempt.modelId,
          systemPrompt,
          history: messages,
          images,
          enableTools,
        });

        void Promise.resolve(result.usage)
          .then((usage) =>
            logSuccess({
              modelLabel: `${attempt.provider}:${attempt.modelId}:ai-sdk`,
              promptTokens: usage.inputTokens,
              completionTokens: usage.outputTokens,
              usedFallback: i > 0,
              provider: attempt.provider,
            }),
          )
          .catch(() => undefined);

        void Promise.resolve(result.text)
          .then(async (fullText) => {
            if (!activeSessionId) return;
            const { displayText, tools } = extractToolsFromAssistantText(fullText);
            const mergedTools = tools.length ? tools : collectedTools;
            await appendChatMessage(supabase, {
              sessionId: activeSessionId,
              userId: auth.userId,
              role: "assistant",
              content: displayText || fullText,
              toolResults: mergedTools,
              isAiDraft: true,
              modelId: attempt.modelId,
              promptVersion,
            });
          })
          .catch(() => undefined);

        return aiSdkTextStreamResponse(result, collectedTools, {
          "X-Sonogyn-Ai-Transport": "ai-sdk",
          "X-Sonogyn-Prompt-Version": promptVersion,
          "X-Sonogyn-Session-Id": activeSessionId ?? "",
          ...(i > 0 ? { "X-Sonogyn-Model-Fallback": "1" } : {}),
        });
      } catch (error) {
        lastError = error;
        safeLog("ai chat ai-sdk stream error", redactForAiLog({
          message: error instanceof Error ? error.message : "unknown",
          userId: auth.userId,
          attempt: attempt.modelId,
        }) as Record<string, unknown>);
        if (i < modelChain.length - 1) continue;
      }
    }

    await logAiChatEvent({
      userId: auth.userId,
      domain,
      success: false,
      durationMs: Date.now() - started,
      model: `${llm.provider}:${selectedModel}:ai-sdk`,
      errorCode: "provider",
      hasImages,
      promptVersion,
      sessionId: activeSessionId,
    });
    safeLog("ai chat ai-sdk exhausted", {
      userId: auth.userId,
      message: lastError instanceof Error ? lastError.message : "unknown",
    });
    return NextResponse.json(
      { error: userMessageForAiError("provider"), code: "provider" },
      { status: 502 },
    );
  }

  let providerResult: Awaited<ReturnType<typeof callOpenRouterChat>> | null = null;
  let usedFallback = false;
  let activeAttempt = modelChain[0] ?? {
    modelId: llm.model,
    provider: llm.provider,
    apiKey: llm.apiKey,
    url: llm.url,
    isLocal: llm.isLocal,
  };

  for (let i = 0; i < modelChain.length; i++) {
    const attempt = modelChain[i]!;
    if (!attempt.apiKey || !attempt.url) continue;
    const providerMessages = buildProviderMessages({
      history: messages,
      images,
      systemPrompt,
    });

    // Failover only before any bytes are sent to the client (stream starts after this loop).
    const result = await callOpenRouterChat({
      apiKey: attempt.apiKey,
      url: attempt.url,
      appUrl,
      body: {
        model: attempt.modelId,
        messages: providerMessages,
        stream: useStream,
        max_tokens: 4096,
      },
      timeoutMs: attempt.isLocal
        ? LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS
        : CLOUD_PROVIDER_ATTEMPT_TIMEOUT_MS,
      maxAttempts: attempt.isLocal ? 1 : 2,
    });

    if (result.ok) {
      providerResult = result;
      usedFallback = i > 0;
      activeAttempt = attempt;
      break;
    }

    const hasNext = modelChain.slice(i + 1).some((a) => a.apiKey && a.url);
    if (
      shouldFailoverToNextProvider({
        status: result.status,
        code: result.code,
        bodyText: result.bodyText,
        hasNextProvider: hasNext,
        streamCommitted: false,
      })
    ) {
      safeLog("ai chat provider fallback", {
        userId: auth.userId,
        status: result.status,
        code: result.code,
        from: `${attempt.provider}:${attempt.modelId}`,
        to: modelChain[i + 1]
          ? `${modelChain[i + 1]!.provider}:${modelChain[i + 1]!.modelId}`
          : undefined,
      });
      continue;
    }

    safeLog("ai chat provider error", redactForAiLog({
      status: result.status,
      code: result.code,
      provider: attempt.provider,
      userId: auth.userId,
    }) as Record<string, unknown>);

    if (persistChat) {
      await logAiChatEvent({
        userId: auth.userId,
        domain,
        success: false,
        durationMs: Date.now() - started,
        model: `${attempt.provider}:${attempt.modelId}`,
        errorCode: result.code,
        hasImages,
        promptVersion,
        sessionId: activeSessionId,
      });
    }
    return NextResponse.json(
      { error: userMessageForAiError(result.code), code: result.code },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  if (!providerResult?.ok) {
    return NextResponse.json(
      { error: userMessageForAiError("provider"), code: "provider" },
      { status: 502 },
    );
  }

  await logSuccess({
    modelLabel: `${activeAttempt.provider}:${activeAttempt.modelId}`,
    usedFallback,
    provider: activeAttempt.provider,
  });

  if (useStream) {
    const body = providerResult.response.body;
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
        "X-Sonogyn-Prompt-Version": promptVersion,
        "X-Sonogyn-Session-Id": activeSessionId ?? "",
        "X-Sonogyn-Gateway-Provider": String(activeAttempt.provider),
        ...(usedFallback ? { "X-Sonogyn-Model-Fallback": "1" } : {}),
      },
    });
  }

  try {
    const data = await providerResult.response.json();
    let assistantText =
      typeof data === "object" && data && "choices" in data
        ? ((data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message
            ?.content ?? "")
        : "";

    let evidenceValidation: ReturnType<typeof postValidateEvidenceAnswer> | null = null;
    if (mode === "evidence" && evidenceAnswer && assistantText) {
      evidenceValidation = postValidateEvidenceAnswer(assistantText, evidenceAnswer);
      if (evidenceValidation.replaced) {
        assistantText = evidenceValidation.text;
        promptVersion = "evidence-dual-llm-validated-fallback-v1";
        if (data && typeof data === "object" && "choices" in data) {
          const choices = (data as { choices?: { message?: { content?: string } }[] }).choices;
          if (choices?.[0]?.message) choices[0].message.content = assistantText;
        }
      }
    }

    if (activeSessionId && assistantText) {
      const { displayText, tools } = extractToolsFromAssistantText(assistantText);
      await appendChatMessage(supabase, {
        sessionId: activeSessionId,
        userId: auth.userId,
        role: "assistant",
        content: displayText || assistantText,
        toolResults: tools,
        evidence: evidenceAnswer ?? undefined,
        isAiDraft: true,
        modelId: activeAttempt.modelId,
        promptVersion,
      });
    }

    if (evidenceAnswer) {
      return NextResponse.json({
        ...data,
        evidence: evidenceAnswer,
        mode: "evidence",
        sessionId: activeSessionId,
        promptVersion,
        isAiDraft: true,
        evidenceMeta: {
          llmCalls: 2,
          singlePass: false,
          validated: evidenceValidation?.ok ?? false,
          replaced: evidenceValidation?.replaced ?? false,
          reasons: evidenceValidation?.reasons ?? [],
          provider: activeAttempt.provider,
          usedFallback,
        },
      });
    }
    return NextResponse.json({
      ...data,
      sessionId: activeSessionId,
      promptVersion,
      isAiDraft: true,
    });
  } catch (error) {
    return handleApiError(error, 500, { route: "POST /api/ai/chat", channel: "ai-chat" });
  }
}

const FeedbackSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.union([z.literal(-1), z.literal(1)]),
});

export async function PUT(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }

  const { messageId, rating } = parsed.data;
  const { data: msg } = await supabase
    .from("ai_chat_messages")
    .select("id")
    .eq("id", messageId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const { error } = await supabase.from("ai_chat_message_feedback").upsert(
    {
      message_id: messageId,
      user_id: auth.userId,
      rating,
    },
    { onConflict: "message_id,user_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
