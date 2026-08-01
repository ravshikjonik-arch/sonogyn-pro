import {
  TutorResponseSchema,
  buildExplainSystemPrompt,
  buildExplainUserPrompt,
  buildRuleFirstExplain,
  mergeLlmExplain,
  type TutorLevel,
  type TutorQuestionContext,
  type TutorResponse,
} from "@repo/ai-tutor";

import {
  callOpenRouterChat,
  extractOpenRouterChatContent,
  type OpenRouterChatCompletion,
} from "@/lib/ai/sonogyn-chat/openrouter-client";

const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions";

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

async function deepenWithLlm(
  question: TutorQuestionContext,
  level: TutorLevel,
  base: TutorResponse,
): Promise<TutorResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return base;

  const model =
    process.env.OPENROUTER_TUTOR_MODEL?.trim() ||
    process.env.OPENROUTER_ORADS_MODEL?.trim() ||
    "openai/gpt-4o-mini";

  const result = await callOpenRouterChat({
    apiKey,
    url: OPENROUTER_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://sonogyn-pro.ru",
    timeoutMs: 45_000,
    maxAttempts: 2,
    body: {
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildExplainSystemPrompt(level) },
        { role: "user", content: buildExplainUserPrompt(question, level) },
      ],
    },
  });

  if (!result.ok) return base;

  const data = (await result.response.json()) as OpenRouterChatCompletion;
  const content = extractOpenRouterChatContent(data);
  if (!content) return base;

  const parsed = extractJsonObject(content) as {
    answer?: string;
    keyPoints?: string[];
    followUpQuestions?: string[];
    whyWrong?: string | null;
  } | null;
  if (!parsed) return base;

  const merged = mergeLlmExplain(base, parsed);
  const validated = TutorResponseSchema.safeParse(merged);
  return validated.success ? validated.data : base;
}

export async function orchestrateTutorExplain(params: {
  question: TutorQuestionContext;
  level: TutorLevel;
  deepen: boolean;
}): Promise<TutorResponse> {
  const base = buildRuleFirstExplain(params.question, params.level);
  if (!params.deepen) return base;
  return deepenWithLlm(params.question, params.level, base);
}
