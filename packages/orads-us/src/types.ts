/** ACR O-RADS US v2022 assessment category labels. */
export type OradsCategoryLabel =
  | "O-RADS 0"
  | "O-RADS 1"
  | "O-RADS 2"
  | "O-RADS 3"
  | "O-RADS 4"
  | "O-RADS 5";

export type OradsCategoryNumber = 0 | 1 | 2 | 3 | 4 | 5;

/** UI risk band color token (maps to design system in Phase 2). */
export type OradsColorCode = "slate" | "sky" | "emerald" | "amber" | "orange" | "red";

/** Terminal node payload — text via i18n keys, not inline copy. */
export type OradsTreeResult = {
  category: OradsCategoryLabel;
  categoryNumber: OradsCategoryNumber;
  /** Official ROM range string (ACR O-RADS US v2022 Table 2). */
  riskPercent: string;
  managementKey: string;
  colorCode: OradsColorCode;
  /** Optional rationale key for audit / report footnote. */
  rationaleKey?: string;
};

export type OradsDecisionOption = {
  id: string;
  labelKey: string;
  /** Next wizard node id. Mutually exclusive with `result`. */
  next?: string;
  /** Terminal category when this option is chosen. Mutually exclusive with `next`. */
  result?: OradsTreeResult;
  imageRef?: string;
};

export type OradsDecisionNode = {
  id: string;
  questionKey: string;
  helpKey?: string;
  imageRef?: string;
  options: OradsDecisionOption[];
};

export type OradsLocaleCode = "ru" | "en" | "es" | "fr" | "ar";

export type OradsTreePathStep = {
  nodeId: string;
  optionId: string;
};
