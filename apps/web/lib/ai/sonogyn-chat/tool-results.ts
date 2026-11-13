import type { AllowedAiToolName, ToolExecutionResult } from "./tools/schemas";

const TOOLS_BLOCK_RE = /```sonogyn-tools\s*([\s\S]*?)```/i;

export function formatToolResultsBlock(tools: ToolExecutionResult[]): string {
  if (!tools.length) return "";
  return `\n\`\`\`sonogyn-tools\n${JSON.stringify(tools)}\n\`\`\``;
}

export function extractToolsFromAssistantText(text: string): {
  displayText: string;
  tools: ToolExecutionResult[];
} {
  const match = text.match(TOOLS_BLOCK_RE);
  if (!match) return { displayText: text.trim(), tools: [] };
  const displayText = text.replace(TOOLS_BLOCK_RE, "").trim();
  try {
    const parsed = JSON.parse(match[1]!.trim()) as ToolExecutionResult[];
    if (Array.isArray(parsed)) return { displayText, tools: parsed };
  } catch {
    /* ignore */
  }
  return { displayText: text.trim(), tools: [] };
}

export const TOOL_LABELS: Record<AllowedAiToolName, string> = {
  calculate_orads: "O-RADS",
  calculate_birads: "BI-RADS",
  calculate_tirads: "ACR TI-RADS",
  calculate_adnex: "IOTA ADNEX",
  calculate_lr2: "IOTA LR2",
  calculate_srrisk: "IOTA Simple Rules Risk",
  assess_fmf_screening: "FMF",
};

export type ToolDisplayState =
  | "rejected"
  | "awaiting_review"
  | "not_computed"
  | "recommendation_incomplete"
  | "provisional"
  | "complete";

/** Display state from structured fields only (`rejected`, `review`, `ok`, `status`, `completeness`). */
export function toolDisplayState(tool: ToolExecutionResult): ToolDisplayState {
  if (tool.rejected) return "rejected";
  if (tool.review?.state === "pending" && tool.ok) return "awaiting_review";
  if (!tool.ok) return "not_computed";
  if (tool.status === "incomplete") return "recommendation_incomplete";
  if (tool.status === "provisional") return "provisional";
  return "complete";
}

export type ToolStatusLabel = { text: string; tone: "ok" | "warn" };

/** Text label for the result card (status is never conveyed by colour alone). */
export function toolStatusLabel(tool: ToolExecutionResult): ToolStatusLabel {
  switch (toolDisplayState(tool)) {
    case "rejected":
      return { text: "Вызов отклонён", tone: "warn" };
    case "awaiting_review":
      return { text: "Ожидает подтверждения врачом", tone: "warn" };
    case "not_computed":
      return { text: "Нужны данные", tone: "warn" };
    case "recommendation_incomplete":
      return { text: "Рекомендация: нужны данные", tone: "warn" };
    case "provisional":
      return { text: "Предварительно", tone: "warn" };
    default:
      return { text: "Готово", tone: "ok" };
  }
}

export const EMPTY_ANSWER_NOTICE =
  "Ответ модели не сформирован (достигнут лимит шагов или ошибка). Ниже — результаты инструментов как есть; интерпретация — специалистом.";

/** Latest result per tool in call order (a corrected call supersedes the rejected one). */
export function latestToolResults(tools: readonly ToolExecutionResult[]): ToolExecutionResult[] {
  const latest = new Map<AllowedAiToolName, ToolExecutionResult>();
  for (const tool of tools) latest.set(tool.tool, tool);
  return [...latest.values()];
}

function detail(tool: ToolExecutionResult): string {
  return [tool.error, ...(tool.limitations ?? [])].filter(Boolean).join(" ");
}

/**
 * Server-side status notice appended to every answer whose latest tool results are not complete. Built from the
 * structured result fields only — it does not depend on what the model wrote.
 */
export function buildToolCompletionNotice(text: string, tools: readonly ToolExecutionResult[]): string {
  const lines: string[] = [];
  if (!text.trim() && tools.length) lines.push(EMPTY_ANSWER_NOTICE);

  for (const tool of latestToolResults(tools)) {
    const label = TOOL_LABELS[tool.tool];
    const why = detail(tool);
    switch (toolDisplayState(tool)) {
      case "rejected":
        lines.push(`Внимание: вызов ${label} отклонён — расчёт не выполнен. ${why}`.trim());
        break;
      case "awaiting_review":
        lines.push(`Внимание: ${label} — результат не показан до подтверждения входных данных врачом в карточке.`);
        break;
      case "not_computed":
        lines.push(`Внимание: расчёт ${label} не завершён — значения ${label} в ответе не являются результатом расчёта. ${why}`.trim());
        break;
      case "recommendation_incomplete":
        lines.push(`Внимание: категория ${label} рассчитана, но рекомендация не определена. ${why}`.trim());
        break;
      case "provisional":
        lines.push(`Внимание: расчёт ${label} предварительный. ${why}`.trim());
        break;
      default:
        break;
    }
  }
  return lines.length ? `\n\n${lines.join("\n")}` : "";
}
