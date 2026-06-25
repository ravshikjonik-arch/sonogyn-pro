import {
  gradeCarotidStenosis,
  type CarotidStenosisInput,
  type CarotidStenosisResult,
} from "@/lib/ai/vascular-ultrasound/carotid-stenosis";
import {
  getVascularProtocolChecklist,
  type VascularBasinId,
} from "@/lib/ai/vascular-ultrasound/protocol-checklists";
import {
  buildVascularUltrasoundSystemPrompt,
  VASCULAR_US_DISCLAIMER,
} from "@/lib/ai/vascular-ultrasound/system-prompt";

export type VascularAssistMode = "clinical" | "teaching" | "report";

export type VascularAssistInput = {
  mode?: VascularAssistMode;
  basin?: VascularBasinId;
  freeText?: string;
  clinicalContext?: string;
  carotid?: CarotidStenosisInput;
};

export type VascularAssistResult = {
  pipeline: string;
  disclaimer: string;
  mode: VascularAssistMode;
  basin?: VascularBasinId;
  carotidGrade?: CarotidStenosisResult;
  protocolChecklist?: ReturnType<typeof getVascularProtocolChecklist>;
  aiText?: string;
  suggestedSections: string[];
};

function buildFallbackSummary(input: VascularAssistInput, carotid?: CarotidStenosisResult): string {
  const parts: string[] = [];
  const checklist = input.basin ? getVascularProtocolChecklist(input.basin) : undefined;

  if (checklist) {
    parts.push(`**Бассейн:** ${checklist.title} (${checklist.kulikovChapter})`);
    parts.push(`**Показания:** ${checklist.indication}`);
  }

  if (carotid) {
    parts.push(
      `**Каротидный стеноз (допплер):** ${carotid.label} (${carotid.percentRange}).`,
      `Критерии: ${carotid.criteria.join("; ")}.`,
      `Риск: ${carotid.strokeRiskNote}`,
    );
  }

  if (input.freeText?.trim()) {
    parts.push(`**Введённые данные:** ${input.freeText.trim()}`);
    parts.push(
      "Для полной интерпретации укажите: сторона, PSV/EDV, диаметр, морфология бляшки, симптоматика, функциональные пробы.",
    );
  } else if (!carotid) {
    parts.push("Введите описание исследования или параметры допплера для интерпретации.");
  }

  if (input.mode === "teaching") {
    parts.push(
      "**Контрольный вопрос:** какие допплер-критерии вы используете для градации стеноза ВСА в вашем центре?",
    );
  }

  return parts.join("\n\n");
}

async function callOpenRouter(systemPrompt: string, userContent: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  const url = process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(appUrl ? { "HTTP-Referer": appUrl } : {}),
      "X-Title": "Sonogyn Vascular US",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_ORADS_MODEL?.trim() || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function analyzeVascularUltrasoundAssist(
  input: VascularAssistInput,
): Promise<VascularAssistResult> {
  const mode = input.mode ?? "clinical";
  const checklist = input.basin ? getVascularProtocolChecklist(input.basin) : undefined;
  const carotidGrade = input.carotid ? gradeCarotidStenosis(input.carotid) : undefined;

  const userContent = [
    input.clinicalContext ? `Клинический контекст: ${input.clinicalContext}` : "",
    input.basin && checklist ? `Бассейн исследования: ${checklist.title}` : "",
    carotidGrade
      ? `Расчёт стеноза ВСА: ${carotidGrade.label} (${carotidGrade.percentRange}); критерии: ${carotidGrade.criteria.join("; ")}`
      : "",
    input.mode === "report" ? "Сформируй структурированное заключение по шаблону." : "",
    input.mode === "teaching" ? "Режим обучения: разбор с алгоритмом и контрольными вопросами." : "",
    input.freeText ? `Данные исследования:\n${input.freeText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = buildVascularUltrasoundSystemPrompt(mode === "teaching" ? "teaching" : "clinical");
  const aiText = userContent.trim()
    ? await callOpenRouter(systemPrompt, userContent)
    : null;

  const suggestedSections =
    checklist?.reportSections ?? [
      "Описание",
      "Ультразвуковые признаки",
      "Гемодинамическая оценка",
      "Заключение",
      "Рекомендации",
    ];

  return {
    pipeline: aiText ? "openrouter-vascular-us-v1" : "vascular-us-rules-v1",
    disclaimer: VASCULAR_US_DISCLAIMER,
    mode,
    basin: input.basin,
    carotidGrade,
    protocolChecklist: checklist,
    aiText: aiText ?? buildFallbackSummary(input, carotidGrade),
    suggestedSections,
  };
}
