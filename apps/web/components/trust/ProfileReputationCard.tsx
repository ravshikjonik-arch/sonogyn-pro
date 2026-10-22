import Link from "next/link";

import { ReputationLevelBadge } from "@/components/trust/ReputationLevelBadge";
import { Button } from "@/components/ui/button";
import { REPUTATION_LEVELS, resolveReputationLevel } from "@/lib/trust/reputation-levels";

type Props = {
  reputation: number;
  casesCount: number;
  isVerified: boolean;
};

export function ProfileReputationCard({ reputation, casesCount, isVerified }: Props) {
  const level = resolveReputationLevel(reputation);
  const next = REPUTATION_LEVELS.find((l) => l.min > reputation);

  return (
    <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">
        Репутация автора
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-3xl font-black text-[var(--clinical-foreground)]">{reputation}</p>
        <ReputationLevelBadge reputation={reputation} />
      </div>
      <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">
        Опубликовано кейсов: <span className="font-semibold text-[var(--clinical-foreground)]">{casesCount}</span>
        {next ? (
          <>
            {" "}
            · до уровня «{next.label}»: {next.min - reputation} баллов
          </>
        ) : null}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Баллы начисляются за публикации, голоса коллег (только от подтверждённых врачей) и избранные кейсы.
        Уровень: {level.label}.
      </p>
      {!isVerified ? (
        <Button asChild size="sm" className="mt-4" variant="secondary">
          <Link href="/verify">Подтвердить статус — чтобы голосовать</Link>
        </Button>
      ) : null}
    </div>
  );
}
