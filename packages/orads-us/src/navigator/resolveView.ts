import { getOradsDecisionNode, ORADS_TREE_OPTIONAL_ENTRY_ID, ORADS_TREE_ROOT_ID } from "../oradsDecisionTree";
import type { OradsDecisionNode, OradsTreePathStep, OradsTreeResult } from "../types";

export type OradsNavigatorView =
  | { kind: "question"; node: OradsDecisionNode; stepIndex: number }
  | { kind: "result"; result: OradsTreeResult; stepIndex: number };

/** Resolve current wizard node/result from a linear path (after technical gate). */
export function resolveOradsNavigatorViewFromPath(path: OradsTreePathStep[]): OradsNavigatorView {
  let nodeId = ORADS_TREE_ROOT_ID;

  for (let i = 0; i < path.length; i += 1) {
    const step = path[i];
    const node = getOradsDecisionNode(nodeId);
    if (!node) break;

    const option = node.options.find((o) => o.id === step.optionId);
    if (!option) break;

    if (option.result) {
      return { kind: "result", result: option.result, stepIndex: i + 1 };
    }

    if (!option.next) break;
    nodeId = option.next;
  }

  const node = getOradsDecisionNode(nodeId);
  if (!node) {
    throw new Error(`Unknown O-RADS node: ${nodeId}`);
  }

  return { kind: "question", node, stepIndex: path.length + 1 };
}

export type OradsNavigatorState = {
  path: OradsTreePathStep[];
  showTechnicalGate: boolean;
  modifierMode: boolean;
  overrideResult: OradsTreeResult | null;
};

export function resolveOradsNavigatorView(state: OradsNavigatorState): OradsNavigatorView {
  if (state.overrideResult) {
    return { kind: "result", result: state.overrideResult, stepIndex: state.path.length + 1 };
  }

  if (state.modifierMode) {
    const node = getOradsDecisionNode("step_modifier_ascites");
    if (node) return { kind: "question", node, stepIndex: state.path.length + 1 };
  }

  if (state.showTechnicalGate) {
    const node = getOradsDecisionNode(ORADS_TREE_OPTIONAL_ENTRY_ID);
    if (node) return { kind: "question", node, stepIndex: 1 };
  }

  return resolveOradsNavigatorViewFromPath(state.path);
}

export function appendOradsNavigatorStep(
  path: OradsTreePathStep[],
  nodeId: string,
  optionId: string,
): OradsTreePathStep[] {
  return [...path, { nodeId, optionId }];
}
