import { classifyOpenRouterHttpStatus, type SonogynAiErrorCode } from "./errors";

export type OpenRouterMessage =
  | { role: string; content: string }
  | {
      role: string;
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

const RETRYABLE = new Set([429, 529, 502, 503]);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type OpenRouterCallResult =
  | { ok: true; response: Response }
  | { ok: false; status: number; bodyText: string; code: SonogynAiErrorCode };

export async function callOpenRouterChat(params: {
  apiKey: string;
  url: string;
  appUrl?: string;
  body: Record<string, unknown>;
  timeoutMs?: number;
  maxAttempts?: number;
}): Promise<OpenRouterCallResult> {
  const { apiKey, url, appUrl, body, timeoutMs = 90_000, maxAttempts = 3 } = params;

  let lastStatus = 500;
  let lastBody = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(appUrl ? { "HTTP-Referer": appUrl } : {}),
          "X-Title": "Sonogyn AI",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        return { ok: true, response };
      }

      lastStatus = response.status;
      lastBody = await response.text();

      if (RETRYABLE.has(response.status) && attempt < maxAttempts - 1) {
        await sleep(500 * 2 ** attempt);
        continue;
      }

      return {
        ok: false,
        status: lastStatus,
        bodyText: lastBody,
        code: classifyOpenRouterHttpStatus(lastStatus, lastBody),
      };
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        return { ok: false, status: 504, bodyText: "timeout", code: "timeout" };
      }
      if (attempt < maxAttempts - 1) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      lastBody = err instanceof Error ? err.message : String(err);
      return { ok: false, status: 500, bodyText: lastBody, code: "unknown" };
    }
  }

  return {
    ok: false,
    status: lastStatus,
    bodyText: lastBody,
    code: classifyOpenRouterHttpStatus(lastStatus, lastBody),
  };
}

export type OpenRouterChatCompletion = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

/** Текст ответа из JSON chat/completions (stream: false) */
export function extractOpenRouterChatContent(data: OpenRouterChatCompletion): string {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  return "";
}

/** Парсинг одной SSE-строки OpenRouter/OpenAI */
export function parseSseDataLine(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  const payload = line.slice(6).trim();
  if (!payload || payload === "[DONE]") return null;
  try {
    const data = JSON.parse(payload) as {
      choices?: { delta?: { content?: string } }[];
    };
    return data.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}
