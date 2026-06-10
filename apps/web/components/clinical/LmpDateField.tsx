"use client";

import { useMemo } from "react";

import { RuDateInput } from "@/components/ui/ru-date-input";
import { cn } from "@/lib/utils/cn";
import { formatRuDate, parseIsoDate } from "@/lib/utils/ru-date";
import {
  eddFromLmp,
  formatGestationalAge,
  gaDaysFromLmp,
  screeningHintsRu,
  splitGaDays,
} from "@repo/medical-calculations";

type LmpDateFieldProps = {
  label?: string;
  hint?: string;
  /** ISO YYYY-MM-DD */
  value?: string;
  onChange: (iso: string | undefined) => void;
  /** ISO — дата, на которую считаем срок (исследование). По умолчанию — сегодня. */
  referenceIso?: string;
  className?: string;
  disabled?: boolean;
  /** Крупная карточка срока под полем */
  showSummary?: boolean;
};

export function LmpDateField({
  label = "ПМП (1-й день последних месячных)",
  hint = "Введите цифры: 20032026 → 20.03.2026. Точки подставятся сами.",
  value,
  onChange,
  referenceIso,
  className,
  disabled,
  showSummary = true,
}: LmpDateFieldProps) {
  const summary = useMemo(() => {
    if (!value) return null;
    const lmp = parseIsoDate(value);
    if (!lmp) return null;
    const ref = referenceIso ? parseIsoDate(referenceIso) : new Date();
    if (!ref) return null;
    const totalDays = gaDaysFromLmp(lmp, ref);
    if (totalDays < 0) {
      return { error: "ПМП позже даты исследования — проверьте даты" };
    }
    const { weeks, days } = splitGaDays(totalDays);
    const edd = eddFromLmp(lmp);
    return {
      ga: formatGestationalAge(totalDays),
      weeks,
      days,
      edd: formatRuDate(edd),
      hints: screeningHintsRu(totalDays),
      refLabel: referenceIso ? "на дату исследования" : "на сегодня",
    };
  }, [value, referenceIso]);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm">
        <span className="font-semibold">{label}</span>
        <RuDateInput className="mt-1" value={value} onChange={onChange} disabled={disabled} />
        <span className="mt-1 block text-xs text-[var(--clinical-foreground-muted)]">{hint}</span>
      </label>
      {showSummary && summary && "error" in summary ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{summary.error}</p>
      ) : showSummary && summary ? (
        <div className="space-y-2 rounded-xl border border-[var(--clinical-primary)]/25 bg-[var(--clinical-primary-muted)] px-3 py-3">
          <p className="text-lg font-bold text-[var(--clinical-foreground)]">
            {summary.ga}{" "}
            <span className="text-sm font-normal text-[var(--clinical-foreground-muted)]">({summary.refLabel})</span>
          </p>
          <div className="grid gap-1 text-xs sm:grid-cols-2">
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
          {summary.hints?.length ? (
            <ul className="border-t border-[var(--clinical-border)] pt-2 text-xs text-[var(--clinical-foreground-muted)]">
              {summary.hints.map((h) => (
                <li key={h}>· {h}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
