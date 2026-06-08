export type RiskResult = {
  category: string;
  riskRange: string;
  description: string;
  impression: string;
};

export type SelectOption = {
  value: string;
  label: string;
};

export type RuleSetConfig = {
  system: "orads" | "birads";
  version: string;
  options: Record<string, SelectOption[]>;
  rules: Array<{
    id: string;
    category: string;
    riskRange: string;
    description: string;
    impression: string;
    when: Partial<Record<string, string | string[]>>;
  }>;
  fallback: RiskResult;
};
