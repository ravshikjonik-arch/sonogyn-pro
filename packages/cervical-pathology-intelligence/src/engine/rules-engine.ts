import type { CpiClinicalRule, CpiRuleCondition } from "../types";

/** Evaluation context built by decision engine — dot-path field access. */
export type CpiRuleEvaluationContext = Record<string, unknown>;

function getField(ctx: CpiRuleEvaluationContext, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function evalLeaf(ctx: CpiRuleEvaluationContext, cond: Extract<CpiRuleCondition, { field: string }>): boolean {
  const actual = getField(ctx, cond.field);
  switch (cond.op) {
    case "eq":
      return actual === cond.value;
    case "neq":
      return actual !== cond.value;
    case "gt":
      return typeof actual === "number" && typeof cond.value === "number" && actual > cond.value;
    case "gte":
      return typeof actual === "number" && typeof cond.value === "number" && actual >= cond.value;
    case "lt":
      return typeof actual === "number" && typeof cond.value === "number" && actual < cond.value;
    case "lte":
      return typeof actual === "number" && typeof cond.value === "number" && actual <= cond.value;
    case "in":
      return Array.isArray(cond.value) && cond.value.includes(actual);
    case "includes":
      return Array.isArray(actual) && actual.includes(cond.value);
    default:
      return false;
  }
}

export function evaluateRuleCondition(ctx: CpiRuleEvaluationContext, cond: CpiRuleCondition): boolean {
  if ("all" in cond) return cond.all.every((c) => evaluateRuleCondition(ctx, c));
  if ("any" in cond) return cond.any.some((c) => evaluateRuleCondition(ctx, c));
  return evalLeaf(ctx, cond);
}

export type MatchedRule = CpiClinicalRule & { matched: true };

/** Evaluates JSON rules sorted by priority (desc). */
export function evaluateClinicalRules(
  rules: CpiClinicalRule[],
  ctx: CpiRuleEvaluationContext,
): MatchedRule[] {
  return [...rules]
    .sort((a, b) => b.priority - a.priority)
    .filter((rule) => evaluateRuleCondition(ctx, rule.when))
    .map((rule) => ({ ...rule, matched: true as const }));
}
