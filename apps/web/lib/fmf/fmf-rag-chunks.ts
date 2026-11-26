import { FMF_KNOWLEDGE_CHUNKS, fmfAttributionLine, type FmfKnowledgeChunk } from "@repo/evidence-retrieval";

const KEYWORDS = [
  "nt",
  "твп",
  "crl",
  "ктр",
  "допплер",
  "ductus",
  "веноз",
  "tricuspid",
  "трикусп",
  "носов",
  "pappa",
  "hcg",
  "риск",
  "трисом",
  "cvs",
  "3.5",
  "эскалац",
  "11",
  "13",
] as const;

function scoreChunk(chunk: FmfKnowledgeChunk, textLower: string): number {
  const fact = chunk.fact.toLowerCase();
  let score = 0;
  for (const k of KEYWORDS) {
    if (textLower.includes(k) && (fact.includes(k) || chunk.topic.includes(k))) score += 2;
  }
  if (chunk.flags?.length && /риск|эскалац|nt|твп/.test(textLower)) score += 1;
  return score;
}

/** Top FMF knowledge chunks for obstetric RAG (structured registry, not raw FMF text). */
export function buildFmfKnowledgeRagSnippet(userText: string, limit = 6): string {
  const t = userText.toLowerCase();
  const ranked = [...FMF_KNOWLEDGE_CHUNKS]
    .map((c) => ({ c, score: scoreChunk(c, t) }))
    .sort((a, b) => b.score - a.score);
  const picked =
    ranked[0]?.score > 0
      ? ranked.filter((r) => r.score > 0).slice(0, limit).map((r) => r.c)
      : FMF_KNOWLEDGE_CHUNKS.slice(0, Math.min(limit, 5));

  const lines = picked.map((c) => {
    const flags = c.flags?.length ? ` [флаги: ${c.flags.join(", ")}]` : "";
    const tool = c.tool ? ` (инструмент: ${c.tool})` : "";
    return `- ${c.fact}${tool}${flags}`;
  });

  return [
    `FMF 11–13 — фрагменты знаний (${fmfAttributionLine()}):`,
  ...lines,
    "Числа риска/центилей — только расчётный модуль fmf на платформе; не выдумывать.",
  ].join("\n");
}