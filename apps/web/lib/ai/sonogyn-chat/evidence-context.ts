import type { AssistantAnswer } from "@repo/evidence-retrieval";

const CLASSIFICATION_VERSION_HINTS: { pattern: RegExp; hint: string }[] = [
  {
    pattern: /o-?rads|орадс|придат/i,
    hint: "При упоминании O-RADS указывай **ACR O-RADS US v2022** и при необходимости IOTA 2026 — не смешивай редакции.",
  },
  {
    pattern: /bi-?rads|бирads|молоч/i,
    hint: "BI-RADS: уточняй модальность (US vs MG) и edition ACR; не подменяй US правила mammography.",
  },
  {
    pattern: /ti-?rads|щитовид|узел щж/i,
    hint: "TI-RADS: указывай применимую систему ACR TI-RADS (edition) и не выдумывай пороги FNA.",
  },
  {
    pattern: /figo|миом|leiomyoma/i,
    hint: "FIGO classification for uterine fibroids — указывай тип (0–8) по FIGO, не смешивай с O-RADS.",
  },
  {
    pattern: /iota/i,
    hint: "IOTA Simple Rules / ADNEX — указывай IOTA 2026 / consensus year из citations.",
  },
];

export function classificationVersionHintsForQuery(userText: string): string[] {
  const t = userText.toLowerCase();
  return CLASSIFICATION_VERSION_HINTS.filter((x) => x.pattern.test(t)).map((x) => x.hint);
}

/** Format retrieved evidence for LLM system prompt (Sonogyn chat evidence mode). */
export function formatEvidenceContextForPrompt(answer: AssistantAnswer): string {
  const lines = [
    `Evidence strength: ${answer.gradeLabel} (${answer.evidenceStrength})`,
    "",
    "Summary:",
    answer.summary,
    "",
  ];

  if (answer.citations.length === 0) {
    lines.push(
      "Citations: **NONE** — you MUST NOT provide clinical recommendations or invented PMIDs/guidelines.",
      "Only explain insufficient evidence and suggest refining the query or opening SonoGyn КР / Evidence Assistant.",
    );
  } else {
    lines.push("Citations (use ONLY these — do not invent PMIDs or guidelines):");
    answer.citations.slice(0, 12).forEach((c, i) => {
      lines.push(
        `[${i + 1}] ${c.title} (${c.provider}${c.year ? `, ${c.year}` : ""})`,
        c.abstract ? `    ${c.abstract.slice(0, 350)}` : "",
        `    URL: ${c.url}`,
      );
    });
  }

  if (answer.guidelines.length > 0) {
    lines.push("", "Guidelines:");
    for (const g of answer.guidelines.slice(0, 6)) {
      lines.push(`- ${g.title} (${g.org}): ${g.url}`);
    }
  }

  if (answer.recommendations.length > 0 && answer.citations.length > 0) {
    lines.push("", "Key recommendations from sources:");
    for (const r of answer.recommendations) lines.push(`- ${r}`);
  }

  lines.push("", answer.disclaimers.join(" "));
  return lines.filter(Boolean).join("\n");
}

export function buildEvidenceModeSystemPrompt(evidenceContext: string, userText?: string): string {
  const classHints = userText ? classificationVersionHintsForQuery(userText) : [];

  return [
    "Ты — Sonogyn Evidence Assistant, помощник врача по доказательной медицине.",
    "",
    "Правила:",
    "- Отвечай на русском, структурированно (markdown, ## заголовки).",
    "- Разделяй: **подтверждённые факты** (только из citations), **интерпретация**, **рекомендации**.",
    "- Используй ТОЛЬКО предоставленные citations — не выдумывай исследования, PMID, названия КР, клинические признаки.",
    "- Если citations пусты — не давай клиническую тактику; только нехватка данных и шаги уточнения.",
    "- Укажи силу доказательств; в конце перечисли ссылки [1]… на использованные источники.",
    "- Это CDS, не финальный диагноз.",
    ...(classHints.length ? ["", "Классификации:", ...classHints.map((h) => `- ${h}`)] : []),
    "",
    "Контекст retrieval (PubMed, Cochrane, КР МЗ РФ, NICE, WHO, EMA, OpenFDA и др.):",
    evidenceContext,
  ].join("\n");
}
