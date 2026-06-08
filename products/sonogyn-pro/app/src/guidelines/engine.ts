import { RiskResult, RuleSetConfig } from "./types";

export function evaluateFromRules(
  config: RuleSetConfig,
  input: Record<string, string>
): RiskResult {
  const matched = config.rules.find((rule) => ruleMatches(rule.when, input));
  if (!matched) {
    return config.fallback;
  }

  return {
    category: matched.category,
    riskRange: matched.riskRange,
    description: matched.description,
    impression: matched.impression,
  };
}

function ruleMatches(
  conditions: Partial<Record<string, string | string[]>>,
  input: Record<string, string>
): boolean {
  return Object.entries(conditions).every(([key, expected]) => {
    const value = input[key];
    if (Array.isArray(expected)) {
      return expected.includes(value);
    }
    return value === expected;
  });
}
