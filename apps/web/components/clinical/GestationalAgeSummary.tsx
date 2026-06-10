"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatRuDate, parseIsoDate } from "@/lib/utils/ru-date";
import {
  eddFromLmp,
  formatGestationalAge,
  gaDaysFromLmp,
  screeningHintsRu,
  splitGaDays,
} from "@repo/medical-calculations";

type Props = {
  lmpIso?: string;
  referenceIso?: string;
  className?: string;
  compact?: boolean;
};

export function GestationalAgeSummary({ lmpIso, referenceIso, className, compact }: Props) {
  const summary = useMemo(() => {
    if (!lmpIso) return null;
    const lmp = parseIsoDate(lmpIso);
    if (!lmp) return null;
    const ref = referenceIso ? parseIsoDate(referenceIso) : new Date();
    if (!ref) return null;
    const totalDays = gaDaysFromLmp(lmp, ref);
    if (totalDays < 0) {
      return { error: "ПМП позже даты исследования — проверьте даты" as const };
    }
    const { weeks, days } = splitGaDays(totalDays);
    return {
      ga: formatGestationalAge(totalDays),
      weeks,
      days,
      edd: formatRuDate(eddFromLmp(lmp)),
      lmpRu: formatRuDate(lmp),
      hints: screeningHintsRu(totalDays),
      refLabel: referenceIso ? "на дату исследования" : "на сегодня",
    };
  }, [lmpIso, referenceIso]);

  if (!summary) return null;

  if ("error" in summary) {
    return (
      <p className={cn("rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", className)}>
        {summary.error}
      </p>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Badge variant="outline" className="text-sm font-semibold">
          {summary.ga}
        </Badge>
        <span className="text-xs text-[var(--clinical-foreground-muted)]">
          ПДР {summary.edd} · ПМП {summary.lmpRu}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--clinical-primary)]/30 bg-gradient-to-br from-[var(--clinical-primary-muted)] to-[var(--clinical-card)] p-4",
        className,
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--clinical-foreground-muted)]">
        Срок беременности {summary.refLabel}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">{summary.ga}</p>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <p>
          <span className="text-[var(--clinical-foreground-muted)]">ПМП: </span>
          <strong>{summary.lmpRu}</strong>
        </p>
        <p>
          <span className="text-[var(--clinical-foreground-muted)]">ПДР: </span>
          <strong>{summary.edd}</strong>
        </p>
        <p>
          <span className="text-[var(--clinical-foreground-muted)]">Детализация: </span>
          <strong>
            {summary.weeks} нед + {summary.days} д
          </strong>
        </p>
      </div>
      {summary.hints.length ? (
        <ul className="mt-3 space-y-1 border-t border-[var(--clinical-border)] pt-3 text-xs text-[var(--clinical-foreground-muted)]">
          {summary.hints.map((h) => (
            <li key={h}>· {h}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Link href="/reference/norms" className="font-medium text-[var(--clinical-primary)] underline">
          Нормы по сроку →
        </Link>
        <Link href="/assistant/fmf" className="font-medium text-[var(--clinical-primary)] underline">
          FMF-ассистент →
        </Link>
      </div>
    </div>
  );
}
