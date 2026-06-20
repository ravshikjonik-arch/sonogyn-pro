import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { UltrasoundCard } from "@/lib/education/fetal-spine/cardsData";

type FetalSpineCardNavigationProps = {
  prev?: UltrasoundCard;
  next?: UltrasoundCard;
};

export function FetalSpineCardNavigation({ prev, next }: FetalSpineCardNavigationProps) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/library/fetal-spine/${prev.id}`}
          className="group flex items-center gap-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-sm transition-all hover:border-[var(--clinical-primary)]/40 hover:shadow-md"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-[var(--clinical-primary)]" />
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
              Предыдущая
            </p>
            <p className="truncate text-sm font-semibold text-[var(--clinical-foreground)] group-hover:text-[var(--clinical-primary-deep)]">
              {prev.title}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/library/fetal-spine/${next.id}`}
          className="group flex items-center justify-end gap-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-sm transition-all hover:border-[var(--clinical-primary)]/40 hover:shadow-md sm:col-start-2"
        >
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
              Следующая
            </p>
            <p className="truncate text-sm font-semibold text-[var(--clinical-foreground)] group-hover:text-[var(--clinical-primary-deep)]">
              {next.title}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--clinical-primary)]" />
        </Link>
      ) : null}
    </div>
  );
}
