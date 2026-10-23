import {
  callOpenRouterChat,
  extractOpenRouterChatContent,
} from "@/lib/ai/sonogyn-chat/openrouter-client";

const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions";

const MODEL = process.env.MESSENGER_AI_MODEL?.trim() || "openai/gpt-4o-mini";

function offlineHint(prompt: string): string {
  return [
    `Запрос: ${prompt.slice(0, 280)}`,
    "",
    "Кратко: опирайтесь на действующие КР и гайдлайны (IOTA, O-RADS, FIGO, TI-RADS — по контексту вопроса).",
    "В чате — только обезличенные учебные формулировки.",
  ].join("\n");
}

/** Free-text tutor hint for @AI in doctor chat (assistive, not a channel message). */
export async function suggestMessengerCommunityAiReply(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return offlineHint(prompt);

  const system = [
    "Ты — учебный помощник SonoGyn Pro для врачей УЗИ/АГ в чате коллег.",
    "Отвечай кратко по-русски, по гайдлайнам и КР, без ФИО и PHI.",
    "Не ставь диагноз; в конце одной фразой: интерпретация — за специалистом.",
  ].join(" ");

  const result = await callOpenRouterChat({
    apiKey,
    url: OPENROUTER_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    body: {
      model: MODEL,
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    },
    timeoutMs: 45_000,
    maxAttempts: 2,
  });

  if (!result.ok) return offlineHint(prompt);

  const json = (await result.response.json().catch(() => null)) as import("@/lib/ai/sonogyn-chat/openrouter-client").OpenRouterChatCompletion;
  const text = extractOpenRouterChatContent(json)?.trim();
  return text && text.length > 0 ? text : offlineHint(prompt);
}
