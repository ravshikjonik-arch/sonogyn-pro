import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import type { ResolvedLlm } from "@/lib/ai/llm-provider";

function openAiCompatibleBaseUrl(llm: ResolvedLlm): string {
  const url = llm.url.trim();
  if (url.includes("openrouter.ai")) return "https://openrouter.ai/api/v1";
  if (url.includes("perplexity.ai")) return "https://api.perplexity.ai";
  return url.replace(/\/chat\/completions\/?$/i, "");
}

export function createAiSdkModel(llm: ResolvedLlm, modelId: string): LanguageModel {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const openai = createOpenAI({
    apiKey: llm.apiKey,
    baseURL: openAiCompatibleBaseUrl(llm),
    headers:
      llm.provider === "openrouter" && appUrl
        ? { "HTTP-Referer": appUrl, "X-Title": "Sonogyn AI" }
        : undefined,
  });
  return openai.chat(modelId);
}
