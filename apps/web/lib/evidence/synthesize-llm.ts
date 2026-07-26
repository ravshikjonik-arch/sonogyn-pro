import type { AssistantAnswer, EvidenceRecord, UnifiedSearchResult } from "@repo/evidence-retrieval";
import { synthesizeEvidenceAnswer } from "@repo/evidence-retrieval";

import { llmSupportsJsonObjectMode, resolveLlmProvider } from "@/lib/ai/llm-provider";

function citationsForPrompt(records: EvidenceRecord[]): string {
  return records
    .slice(0, 12)
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title} (${r.provider}${r.year ? `, ${r.year}` : ""})${r.abstract ? `\n    ${r.abstract.slice(0, 400)}` : ""}\n    URL: ${r.url}`,
    )
    .join("\n\n");
}

const CLINICAL_TRANSLATION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bguidelines?\b/gi, "клинические рекомендации"],
  [/\bsystematic review\b/gi, "систематический обзор"],
  [/\bmeta-analysis\b/gi, "метаанализ"],
  [/\brandomi[sz]ed\b/gi, "рандомизированное"],
  [/\btrial\b/gi, "исследование"],
  [/\bpreeclampsia\b/gi, "преэклампсия"],
  [/\bpre-eclampsia\b/gi, "преэклампсия"],
  [/\bpreterm\b/gi, "преждевременные роды"],
  [/\bprevention\b/gi, "профилактика"],
  [/\bprophylaxis\b/gi, "профилактика"],
  [/\blow-dose\b/gi, "низкая доза"],
  [/\baspirin\b/gi, "аспирин"],
  [/\bpregnancy\b/gi, "беременность"],
  [/\bpregnant\b/gi, "беременные"],
  [/\bfetal\b/gi, "плод"],
  [/\bmaternal\b/gi, "материнский"],
  [/\bultrasound\b/gi, "УЗИ"],
  [/\bscreening\b/gi, "скрининг"],
  [/\brisk reduction\b/gi, "снижение риска"],
  [/\btreatment\b/gi, "лечение"],
  [/\bmanagement\b/gi, "тактика ведения"],
  [/\brecommendations?\b/gi, "рекомендации"],
  [/\bhealthcare providers?\b/gi, "медицинские специалисты"],
  [/\badherence\b/gi, "соблюдение рекомендаций"],
  [/\boutcomes?\b/gi, "исходы"],
  [/\bcohort\b/gi, "когортное исследование"],
  [/\bcase-control\b/gi, "исследование случай-контроль"],
];

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function capitalize(text: string): string {
  return text ? `${text[0]?.toUpperCase()}${text.slice(1)}` : text;
}

function detectClinicalFocus(record: EvidenceRecord): string {
  const haystack = `${record.title} ${record.abstract ?? ""}`.toLowerCase();
  const topics: string[] = [];
  if (haystack.includes("aspirin")) topics.push("аспирин");
  if (haystack.includes("preeclampsia") || haystack.includes("pre-eclampsia")) topics.push("преэклампсия");
  if (haystack.includes("pregnan")) topics.push("беременность");
  if (haystack.includes("preterm")) topics.push("профилактика преждевременной преэклампсии/родов");
  if (haystack.includes("guideline")) topics.push("сопоставление или применение клинических рекомендаций");
  if (haystack.includes("screening")) topics.push("скрининг");
  if (haystack.includes("ultrasound")) topics.push("УЗИ");
  if (haystack.includes("dose") || haystack.includes("mg")) topics.push("дозировка");

  if (topics.length === 0) {
    return "источник найден по вашему клиническому вопросу; откройте оригинал для точной формулировки рекомендаций";
  }

  return `клинический фокус: ${Array.from(new Set(topics)).join(", ")}`;
}

function sourceTypeRu(record: EvidenceRecord): string {
  if (record.recordType === "guideline" || record.provider === "kr_mz_rf") return "клинические рекомендации";
  if (record.recordType === "systematic_review" || record.recordType === "meta_analysis") {
    return "систематический обзор/метаанализ";
  }
  if (record.recordType === "rct" || record.recordType === "clinical_trial") return "клиническое исследование";
  return "научный источник";
}

function buildFallbackSourceTranslations(records: EvidenceRecord[]): LlmPayload["sourceTranslations"] {
  return records.slice(0, 8).map((record) => {
    const sourceNote = `${sourceTypeRu(record)}${record.year ? `, ${record.year}` : ""}`;
    const abstractNote = record.abstract
      ? `В резюме источника есть данные по теме; для точной дозировки/критериев используйте оригинальный текст.`
      : "Краткое резюме недоступно; для полной формулировки откройте оригинал.";
    const originalTitle = stripHtml(record.title);
    return {
      id: record.id,
      titleRu: `${capitalize(sourceNote)} · ${detectClinicalFocus(record)}`,
      keyPointRu: `${abstractNote} Оригинальное название: ${originalTitle}`,
    };
  });
}

function withFallbackTranslations(
  answer: AssistantAnswer,
  searchResult: UnifiedSearchResult,
  translateToRussian: boolean,
): AssistantAnswer {
  if (!translateToRussian || searchResult.records.length === 0) return answer;
  return {
    ...answer,
    sourceTranslations: buildFallbackSourceTranslations(searchResult.records),
  } as AssistantAnswer;
}

type LlmPayload = {
  summary: string;
  evidenceStrength: AssistantAnswer["evidenceStrength"];
  gradeLabel: string;
  recommendations: string[];
  contraindications: string[];
  alternatives: { name: string; rationale: string }[];
  sourceTranslations?: { id: string; titleRu: string; keyPointRu: string }[];
};

export async function synthesizeWithLlm(
  query: string,
  searchResult: UnifiedSearchResult,
  options: { translateToRussian?: boolean } = {},
): Promise<AssistantAnswer> {
  const fallback = synthesizeEvidenceAnswer(query, searchResult);
  const llm = resolveLlmProvider("evidence");
  const translateToRussian = options.translateToRussian !== false;
  if (!llm || searchResult.records.length === 0) {
    return withFallbackTranslations(fallback, searchResult, translateToRussian);
  }

  const system = `You are a clinical evidence synthesis assistant for physicians (Russian UI).
Use ONLY the provided citations. Return strict JSON only (no markdown fences):
{
  "summary": "3-5 sentences in Russian",
  "evidenceStrength": "high|moderate|low|insufficient",
  "gradeLabel": "short Russian label",
  "recommendations": ["..."],
  "contraindications": ["..."],
  "alternatives": [{"name":"...","rationale":"..."}],
  "sourceTranslations": [{"id":"citation id exactly as provided","titleRu":"Russian title translation","keyPointRu":"1-2 concise Russian sentences with the clinically relevant point from title/abstract"}]
}
Never invent PMIDs or guidelines not in citations. CDS disclaimer implied.
If translation is requested, translate the clinical meaning into Russian, but keep drug names, guideline acronyms, classifications, and study names recognizable.`;

  const user = `Clinical question: ${query}

Russian translation mode: ${options.translateToRussian === false ? "off" : "on"}.
When translation mode is on, include sourceTranslations for the most relevant cited English/international sources.

Citations:
${citationsForPrompt(searchResult.records)}`;

  try {
    const body: Record<string, unknown> = {
      model: llm.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };
    if (llmSupportsJsonObjectMode(llm.provider)) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(llm.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llm.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return withFallbackTranslations(fallback, searchResult, translateToRussian);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return withFallbackTranslations(fallback, searchResult, translateToRussian);

    const jsonText = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonText) as LlmPayload;
    const citationIds = new Set(searchResult.records.slice(0, 12).map((c) => c.id));
    const sourceTranslationCandidates =
      parsed.sourceTranslations?.length
        ? parsed.sourceTranslations
        : (buildFallbackSourceTranslations(searchResult.records) ?? []);
    const sourceTranslations = sourceTranslationCandidates
      .filter((item) => citationIds.has(item.id) && item.titleRu?.trim() && item.keyPointRu?.trim())
      .slice(0, 8);
    const guidelines = searchResult.records
      .filter((c) => c.recordType === "guideline" || c.provider === "kr_mz_rf")
      .slice(0, 6)
      .map((c) => ({
        title: c.title,
        url: c.url,
        org: c.provider === "kr_mz_rf" ? "МЗ РФ" : c.journal || c.provider,
      }));

    const sourcesUsed: AssistantAnswer["sourcesUsed"] = {};
    for (const p of searchResult.providers) {
      sourcesUsed[p.provider] = p.status;
    }

    return {
      query,
      summary: parsed.summary || fallback.summary,
      evidenceStrength: parsed.evidenceStrength || fallback.evidenceStrength,
      gradeLabel: parsed.gradeLabel || fallback.gradeLabel,
      recommendations: parsed.recommendations?.length ? parsed.recommendations : fallback.recommendations,
      contraindications: parsed.contraindications ?? fallback.contraindications,
      alternatives: parsed.alternatives ?? fallback.alternatives,
      citations: searchResult.records.slice(0, 12),
      guidelines,
      disclaimers: fallback.disclaimers,
      sourcesUsed,
      searchedAt: searchResult.searchedAt,
      synthesisMode: "llm",
      ...(translateToRussian && sourceTranslations.length > 0
        ? { sourceTranslations }
        : {}),
    };
  } catch {
    return withFallbackTranslations(fallback, searchResult, translateToRussian);
  }
}
