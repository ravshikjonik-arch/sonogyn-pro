import type { MusaProbabilityCategory, MusaScoreBadgeColor } from "../../../types/musa";
import { MUSA_ADENOMYOSIS_KNOWLEDGE } from "../types";
import type { MusaAdenomyosisScoreInput } from "../types";

export type AdenomyosisScoreResult = {
  total: number;
  maxScore: number;
  breakdown: Array<{ id: string; labelRu: string; points: number; active: boolean }>;
  category: MusaProbabilityCategory;
  labelRu: string;
  badgeColor: MusaScoreBadgeColor;
};

export function calculateAdenomyosisScore(input: MusaAdenomyosisScoreInput): AdenomyosisScoreResult {
  const jzOver12 =
    input.jzThicknessMm != null && Number.isFinite(input.jzThicknessMm) && input.jzThicknessMm > 12;

  const flags: Record<string, boolean> = {
    myometrialCysts: input.myometrialCysts,
    hyperechogenicIslands: input.hyperechogenicIslands,
    subendometrialStriations: input.subendometrialStriations,
    jzOver12mm: jzOver12,
    heterogeneousMyometrium: input.heterogeneousMyometrium,
    asymmetry: input.asymmetry,
    globularUterus: input.globularUterus,
    fanShapedShadowing: input.fanShapedShadowing,
  };

  const breakdown = MUSA_ADENOMYOSIS_KNOWLEDGE.scoring.items.map((item) => ({
    id: item.id,
    labelRu: item.labelRu,
    points: item.points,
    active: Boolean(flags[item.id]),
  }));

  const total = breakdown.filter((b) => b.active).reduce((acc, b) => acc + b.points, 0);
  const maxScore = MUSA_ADENOMYOSIS_KNOWLEDGE.scoring.maxScore;

  const band = MUSA_ADENOMYOSIS_KNOWLEDGE.scoring.interpretation.find(
    (i) => total >= i.min && total <= i.max,
  )!;

  return {
    total,
    maxScore,
    breakdown,
    category: band.category as MusaProbabilityCategory,
    labelRu: band.labelRu,
    badgeColor: band.badgeColor as MusaScoreBadgeColor,
  };
}

export function scoreBadgeClassName(color: MusaScoreBadgeColor): string {
  switch (color) {
    case "green":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "yellow":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "orange":
      return "bg-orange-100 text-orange-900 border-orange-300";
    case "red":
      return "bg-rose-100 text-rose-900 border-rose-300";
    default:
      return "bg-[var(--clinical-muted)]";
  }
}
