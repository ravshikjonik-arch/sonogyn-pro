import type { ToolExecutionResult } from "./tools/schemas";

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
