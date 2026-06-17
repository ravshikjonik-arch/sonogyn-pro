import type { OradsDecisionOption, OradsTreePathStep, OradsTreeResult } from "./types";
import { getOradsDecisionNode, ORADS_DECISION_TREE, ORADS_TREE_ROOT_ID } from "./oradsDecisionTree";

export type WalkOradsTreeResult =
  | { ok: true; result: OradsTreeResult; path: OradsTreePathStep[] }
  | { ok: false; error: "unknown_node" | "unknown_option" | "incomplete_path"; path: OradsTreePathStep[] };

/** Resolve a wizard path (ordered node + option ids) to a terminal O-RADS result. */
export function walkOradsDecisionTree(
  path: OradsTreePathStep[],
  startNodeId: string = ORADS_TREE_ROOT_ID,
): WalkOradsTreeResult {
  if (path.length === 0) {
    return { ok: false, error: "incomplete_path", path: [] };
  }

  let nodeId = startNodeId;
  const walked: OradsTreePathStep[] = [];

  for (const step of path) {
    const node = getOradsDecisionNode(nodeId);
    if (!node) {
      return { ok: false, error: "unknown_node", path: walked };
    }

    const option = node.options.find((o) => o.id === step.optionId);
    if (!option) {
      return { ok: false, error: "unknown_option", path: walked };
    }

    walked.push({ nodeId: node.id, optionId: option.id });

    if (option.result) {
      return { ok: true, result: option.result, path: walked };
    }

    if (!option.next) {
      return { ok: false, error: "incomplete_path", path: walked };
    }

    nodeId = option.next;
  }

  return { ok: false, error: "incomplete_path", path: walked };
}

export function findOradsOption(nodeId: string, optionId: string): OradsDecisionOption | undefined {
  return getOradsDecisionNode(nodeId)?.options.find((o) => o.id === optionId);
}

/** Collect all i18n keys referenced by the tree (for locale completeness checks). */
export function collectOradsTreeLocaleKeys(): string[] {
  const keys = new Set<string>();
  for (const node of Object.values(ORADS_DECISION_TREE)) {
    keys.add(node.questionKey);
    if (node.helpKey) keys.add(node.helpKey);
    for (const opt of node.options) {
      keys.add(opt.labelKey);
      if (opt.result) {
        keys.add(opt.result.managementKey);
        if (opt.result.rationaleKey) keys.add(opt.result.rationaleKey);
      }
    }
  }
  return [...keys].sort();
}
