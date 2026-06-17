import type { OradsTreePathStep } from "./types";
import { findOradsOption } from "./treeWalker";

/** Human-readable summary lines for the wizard result screen (keys already translated). */
export function buildOradsPathSummary(
  path: OradsTreePathStep[],
  translate: (key: string) => string,
): string[] {
  const lines: string[] = [];
  for (const step of path) {
    const option = findOradsOption(step.nodeId, step.optionId);
    if (!option) continue;
    lines.push(`• ${translate(option.labelKey)}`);
  }
  return lines;
}
