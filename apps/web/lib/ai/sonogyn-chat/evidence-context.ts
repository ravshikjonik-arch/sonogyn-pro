import type { AssistantAnswer } from "@repo/evidence-retrieval";

/** Format retrieved evidence for LLM system prompt (Sonogyn chat evidence mode). */
export function formatEvidenceContextForPrompt(answer: AssistantAnswer): string {
  const lines = [
    `Evidence strength: ${answer.gradeLabel} (${answer.evidenceStrength})`,
    "",
    "Summary:",
    answer.summary,
    "",
    "Citations (use ONLY these — do not invent PMIDs or guidelines):",
  ];

  answer.citations.slice(0, 12).forEach((c, i) => {
    lines.push(
      `[${i + 1}] ${c.title} (${c.provider}${c.year ? `, ${c.year}` : ""})`,
      c.abstract ? `    ${c.abstract.slice(0, 350)}` : "",
      `    URL: ${c.url}`,
    );
  });

  if (answer.guidelines.length > 0) {
    lines.push("", "Guidelines:");
    for (const g of answer.guidelines.slice(0, 6)) {
      lines.push(`- ${g.title} (${g.org}): ${g.url}`);
    }
  }

  if (answer.recommendations.length > 0) {
    lines.push("", "Key recommendations from sources:");
    for (const r of answer.recommendations) lines.push(`- ${r}`);
  }

  lines.push("", answer.disclaimers.join(" "));
  return lines.filter(Boolean).join("\n");
}

export function buildEvidenceModeSystemPrompt(evidenceContext: string): string {
  return [
    "Ты — Sonogyn Evidence Assistant, помощник врача по доказательной медицине.",
    "",
    "Правила:",
    "- Отвечай на русском, структурированно (markdown, ## заголовки).",
    "- Используй ТОЛЬКО предоставленные citations — не выдумывай исследования, PMID, названия КР.",
    "- Укажи силу доказательств и практические рекомендации.",
    "- В конце перечисли ссылки [1]… на использованные источники.",
    "- Это CDS, не финальный диагноз.",
    "",
    "Контекст retrieval (PubMed, Cochrane, КР МЗ РФ, NICE, WHO, EMA, OpenFDA и др.):",
    evidenceContext,
  ].join("\n");
}
