"use client";

import {
  calculateAdenomyosisScore,
  scoreBadgeClassName,
  type MusaAdenomyosisScoreInput,
} from "@repo/musa-framework";

import { Badge } from "@/components/ui/badge";
import { MusaCard } from "@/components/musa/MusaCard";

type ScoreCalculatorProps = {
  input: MusaAdenomyosisScoreInput;
};

export function ScoreCalculator({ input }: ScoreCalculatorProps) {
  const score = calculateAdenomyosisScore(input);

  return (
    <MusaCard title="Sonogyn Adenomyosis Score" description="MUSA composite (макс. 13)">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-3xl font-bold tabular-nums">
          {score.total}
          <span className="text-lg text-[var(--clinical-foreground-muted)]">/{score.maxScore}</span>
        </div>
        <Badge className={`border ${scoreBadgeClassName(score.badgeColor)}`}>{score.labelRu}</Badge>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {score.breakdown.map((item) => (
          <li
            key={item.id}
            className={`flex justify-between rounded-lg px-3 py-2 ${
              item.active ? "bg-[var(--clinical-primary)]/10" : "bg-[var(--clinical-muted)]/50"
            }`}
          >
            <span>{item.labelRu}</span>
            <span className="font-mono">{item.active ? `+${item.points}` : "0"}</span>
          </li>
        ))}
      </ul>
    </MusaCard>
  );
}
