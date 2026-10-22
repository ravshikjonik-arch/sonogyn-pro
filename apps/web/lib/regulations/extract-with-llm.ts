import {
  llmSupportsJsonObjectMode,
  resolveLlmProvider,
} from "@/lib/ai/llm-provider";

import {
  regulationExtractionEnvelopeSchema,
  type RegulationExtractionEnvelope,
} from "./extraction-schema";

const SYSTEM = `Ты эксперт акушер-гинеколог и врач УЗД, анализируешь официальные документы МЗ РФ и ДЗМ для платформы SonoGyn Pro.

Извлеки только релевантное для гинекологии, акушерства и УЗД. Не выдумывай номера приказов и формулировки — если данных нет, оставь поле пустым или evidence_level "unknown".

Ответ — один JSON-объект без markdown:
{
  "confidence": "low"|"medium"|"high",
  "reviewNotesForEditor": "string",
  "draft": {
    "title", "summary", "shelf", "documentKind", "issuer", "specialty",
    "year", "officialUrl", "documentNumber",
    "relevantSections": string[],
    "recommendations": [{ "clinical_guideline", "evidence_level", "applicable_to" }],
    "protocolChanges": string[],
    "contraindications": string[],
    "relatedNosologyIds": string[]
  }
}`;

function stripJsonFence(text: string): string {
  const t = text.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return (fenced ? fenced[1] : t).trim();
}

export async function extractRegulationWithLlm(input: {
  title: string;
  sourceUrl: string;
  rawText: string;
}): Promise<{ envelope: RegulationExtractionEnvelope; model: string } | { error: string }> {
  const llm = resolveLlmProvider("text");
  if (!llm) {
    return { error: "LLM not configured (OPENROUTER_API_KEY or PERPLEXITY_API_KEY)" };
  }

  const userContent = [
    `Заголовок: ${input.title}`,
    `URL: ${input.sourceUrl}`,
    "",
    "Текст документа (фрагмент):",
    input.rawText.slice(0, 48_000),
  ].join("\n");

  const body: Record<string, unknown> = {
    model: llm.model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
  };

  if (llmSupportsJsonObjectMode(llm.provider)) {
    body.response_format = { type: "json_object" };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${llm.apiKey}`,
    "Content-Type": "application/json",
  };
  if (llm.provider === "openrouter") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://sonogyn-pro.ru";
    headers["HTTP-Referer"] = appUrl;
  }

  const res = await fetch(llm.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { error: `LLM HTTP ${res.status}: ${errText.slice(0, 200)}` };
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw?.trim()) {
    return { error: "Empty LLM response" };
  }

  try {
    const parsed = regulationExtractionEnvelopeSchema.parse(JSON.parse(stripJsonFence(raw)));
    return { envelope: parsed, model: `${llm.provider}:${llm.model}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Schema validation failed: ${msg}` };
  }
}
