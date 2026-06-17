import {
  getOradsDecisionNode,
  ORADS_TREE_ROOT_ID,
  type OradsDecisionNode,
  type OradsTreePathStep,
  type OradsTreeResult,
} from "@repo/orads-us";

export type OradsWizardViewState =
  | { kind: "question"; node: OradsDecisionNode; stepIndex: number }
  | { kind: "result"; result: OradsTreeResult; stepIndex: number };

export function resolveOradsWizardView(path: OradsTreePathStep[]): OradsWizardViewState {
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

export function appendOradsWizardStep(
  path: OradsTreePathStep[],
  nodeId: string,
  optionId: string,
): OradsTreePathStep[] {
  return [...path, { nodeId, optionId }];
}
