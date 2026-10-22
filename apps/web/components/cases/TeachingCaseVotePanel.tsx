"use client";

import { ArrowBigDown, ArrowBigUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  caseId: string;
  voteUpCount: number;
  rating: number;
  userVote?: 1 | -1 | null;
  disabled?: boolean;
  onVote: (caseId: string, vote: 1 | -1 | 0) => void;
  className?: string;
};

export function TeachingCaseVotePanel({
  caseId,
  voteUpCount,
  rating,
  userVote = null,
  disabled,
  onVote,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-1 py-0.5",
        className,
      )}
    >
      <Button
        size="sm"
        variant={userVote === 1 ? "default" : "ghost"}
        type="button"
        className="h-8 gap-0.5 px-2"
        disabled={disabled}
        aria-label="Голос за кейс"
        onClick={() => onVote(caseId, userVote === 1 ? 0 : 1)}
      >
        <ArrowBigUp className="h-4 w-4" />
        {voteUpCount}
      </Button>
      <Button
        size="sm"
        variant={userVote === -1 ? "default" : "ghost"}
        type="button"
        className="h-8 px-2"
        disabled={disabled}
        aria-label="Голос против"
        onClick={() => onVote(caseId, userVote === -1 ? 0 : -1)}
      >
        <ArrowBigDown className="h-4 w-4" />
      </Button>
      <span className="px-1 text-xs font-semibold text-[var(--clinical-foreground-muted)]">{rating}</span>
    </div>
  );
}
