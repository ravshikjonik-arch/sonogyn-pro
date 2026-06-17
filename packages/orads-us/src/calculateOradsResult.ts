import type { OradsTreePathStep, OradsTreeResult } from "./types";
import { ORADS_TREE_ROOT_ID } from "./oradsDecisionTree";
import { walkOradsDecisionTree, type WalkOradsTreeResult } from "./treeWalker";

/** One wizard answer: node id + chosen option id. */
export type UserAnswer = OradsTreePathStep;

/** Ordered path through the decision tree (accumulated user choices). */
export type UserAnswers = UserAnswer[];

/** Terminal assessment returned by {@link calculateOradsResult}. */
export type OradsResult = OradsTreeResult & {
  path: OradsTreePathStep[];
};

export type CalculateOradsResultSuccess = {
  ok: true;
  result: OradsResult;
};

export type CalculateOradsResultFailure = Extract<WalkOradsTreeResult, { ok: false }>;

export type CalculateOradsResult = CalculateOradsResultSuccess | CalculateOradsResultFailure;

/**
 * Pure function: resolve accumulated wizard answers to an O-RADS US v2022 category.
 * @param answers Ordered list of { nodeId, optionId } from the wizard path.
 * @param startNodeId Defaults to {@link ORADS_TREE_ROOT_ID} (`step1_localization`).
 */
export function calculateOradsResult(
  answers: UserAnswers,
  startNodeId: string = ORADS_TREE_ROOT_ID,
): CalculateOradsResult {
  const walked = walkOradsDecisionTree(answers, startNodeId);
  if (!walked.ok) return walked;
  return {
    ok: true,
    result: {
      ...walked.result,
      path: walked.path,
    },
  };
}
