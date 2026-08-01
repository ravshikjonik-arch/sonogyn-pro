import { EVIDENCE_CORPUS_MODE_LABELS } from "./corpus-mode.js";
import type { AssistantAnswer, EvidenceRecord } from "./types.js";

/** Plain-text card for clipboard / Share (IQDOC-style “ready result”). */
export function formatEvidenceAnswerForClipboard(answer: AssistantAnswer): string {
  const lines: string[] = [
    "SonoGyn Evidence Assistant",
    `Вопрос: ${answer.query}`,
  ];

  if (answer.corpusMode && answer.corpusMode !== "all") {
    lines.push(`Корпус: ${EVIDENCE_CORPUS_MODE_LABELS[answer.corpusMode]}`);
  }

  lines.push(`Сила доказательств: ${answer.gradeLabel}`, "", answer.summary.trim());

  if (answer.recommendations.length > 0) {
    lines.push("", "Рекомендации:");
    for (const r of answer.recommendations) lines.push(`• ${r}`);
  }

  if (answer.contraindications.length > 0) {
    lines.push("", "Осторожность:");
    for (const c of answer.contraindications) lines.push(`• ${c}`);
  }

  if (answer.citations.length > 0) {
    lines.push("", "Источники:");
    answer.citations.slice(0, 8).forEach((c, i) => {
      lines.push(...formatCitationLines(c, i + 1));
    });
  } else {
    lines.push("", "Источники: не найдены в выбранном корпусе.");
  }

  lines.push(
    "",
    "Справочная информация (CDS). Не диагноз; интерпретация — специалист.",
    "https://sonogyn-pro.ru/tools/refs/evidence-assistant",
  );

  return lines.join("\n");
}

function formatCitationLines(c: EvidenceRecord, index: number): string[] {
  const head = `${index}. ${c.title}${c.year ? ` (${c.year})` : ""}`;
  const out = [head];
  if (c.section) out.push(`   Раздел: ${c.section}`);
  if (c.quote) out.push(`   «${c.quote}»`);
  out.push(`   ${c.url}`);
  return out;
}
