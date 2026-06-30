import type { AssistantAnswer, EvidenceRecord, UnifiedSearchResult } from "@repo/evidence-retrieval";
import { synthesizeEvidenceAnswer } from "@repo/evidence-retrieval";

const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions";

function citationsForPrompt(records: EvidenceRecord[]): string {
  return records
    .slice(0, 12)
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title} (${r.provider}${r.year ? `, ${r.year}` : ""})${r.abstract ? `\n    ${r.abstract.slice(0, 400)}` : ""}\n    URL: ${r.url}`,
    )
    .join("\n\n");
}

type LlmPayload = {
  summary: string;
  evidenceStrength: AssistantAnswer["evidenceStrength"];
  gradeLabel: string;
  recommendations: string[];
  contraindications: string[];
  alternatives: { name: string; rationale: string }[];
};

export async function synthesizeWithLlm(
  query: string,
  searchResult: UnifiedSearchResult,
): Promise<AssistantAnswer> {
  const fallback = synthesizeEvidenceAnswer(query, searchResult);
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey || searchResult.records.length === 0) return fallback;

  const model =
    process.env.OPENROUTER_EVIDENCE_MODEL?.trim() ||
    process.env.OPENROUTER_ORADS_MODEL?.trim() ||
    "openai/gpt-4o-mini";

  const system = `You are a clinical evidence synthesis assistant for physicians (Russian UI).
Use ONLY the provided citations. Return strict JSON:
{
  "summary": "3-5 sentences in Russian",
  "evidenceStrength": "high|moderate|low|insufficient",
  "gradeLabel": "short Russian label",
  "recommendations": ["..."],
  "contraindications": ["..."],
  "alternatives": [{"name":"...","rationale":"..."}]
}
Never invent PMIDs or guidelines not in citations. CDS disclaimer implied.`;

  const user = `Clinical question: ${query}

Citations:
${citationsForPrompt(searchResult.records)}`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) return fallback;

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content) as LlmPayload;
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
    };
  } catch {
    return fallback;
  }
}
