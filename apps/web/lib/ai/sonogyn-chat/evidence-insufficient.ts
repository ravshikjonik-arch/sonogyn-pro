import type { AssistantAnswer } from "@repo/evidence-retrieval";

export function isInsufficientEvidence(answer: AssistantAnswer): boolean {
  return answer.citations.length === 0 || answer.evidenceStrength === "insufficient";
}

/** Deterministic assistant text when retrieval found no citable sources — no LLM hallucination. */
export function formatInsufficientEvidenceChatReply(answer: AssistantAnswer): string {
  const lines = [
    "## Недостаточно проверенных источников",
    "",
    answer.summary.trim(),
    "",
    "### Что можно сделать",
    "- Уточнить запрос: нозология, классификация (O-RADS US v2022, IOTA 2026, BI-RADS, TI-RADS), контекст.",
    "- Каталог КР: /tools/refs/guidelines · Evidence Assistant: /tools/refs/evidence-assistant (корпус «Все источники»).",
    "- УЗИ-классификации: /tools/calc/rads/o-rads · /tools/refs/iota-terms-2026",
    "",
    "_Подтверждённые данные отсутствуют — клиническая тактика не формулируется._",
    "",
    answer.disclaimers.join(" "),
  ];
  return lines.join("\n");
}
