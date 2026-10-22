import { cn } from "@/lib/utils/cn";
import { resolveReputationLevel } from "@/lib/trust/reputation-levels";

type Props = {
  reputation: number;
  className?: string;
  compact?: boolean;
};

export function ReputationLevelBadge({ reputation, className, compact }: Props) {
  const level = resolveReputationLevel(reputation);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        level.className,
        compact && "px-1.5 py-0 text-[9px]",
        className,
      )}
      title={`Репутация: ${reputation} · уровень «${level.label}»`}
    >
      {level.label}
    </span>
  );
}
