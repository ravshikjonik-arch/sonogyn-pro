"use client";

import {
  BIRADS_CATEGORY_INFO,
  BIRADS_FIELD_LABEL_RU,
  BIRADS_SUSPICIOUS_LABEL_RU,
  type BiradsCategory,
  type BiradsUsLesionResult,
} from "@repo/birads-us";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { CalcChip } from "@/components/calculators/shared/calc-ui";
import { cn } from "@/lib/utils/cn";

const ALL: BiradsCategory[] = ["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"];

function tone(category: BiradsCategory): string {
  if (category === "4A" || category === "4B" || category === "4C" || category === "5") {
    return "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100";
  }
  if (category === "3" || category === "0") {
    return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100";
}

type Props = {
  result: BiradsUsLesionResult;
  doctorCategory: BiradsCategory | undefined;
  onDoctorCategory: (c: BiradsCategory | undefined) => void;
};

export function BreastLesionResultCard({ result, doctorCategory, onDoctorCategory }: Props) {
  const [showAll, setShowAll] = useState(false);
  const shell = "space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-sm";

  if (result.status === "invalid") {
    return (
      <section className={shell} aria-live="polite">
        <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">BI-RADS · результат</p>
        <p className="text-sm text-[var(--clinical-foreground)]">Проверьте ввод: {result.errors.map((e) => e.messageRu).join(" ")}</p>
      </section>
    );
  }
  if (result.status === "incomplete") {
    return (
      <section className={shell} aria-live="polite">
        <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">BI-RADS · результат</p>
        <p className="rounded-xl border border-dashed border-[var(--clinical-border)] px-3 py-4 text-sm text-[var(--clinical-foreground-muted)]">
          Не хватает данных: {result.missing.map((m) => BIRADS_FIELD_LABEL_RU[m]).join(", ")}. {result.messageRu}
        </p>
      </section>
    );
  }

  const options = result.pathway.kind === "determined" ? [result.pathway.category] : result.pathway.options;
  const choices = showAll ? ALL : options;

  return (
    <section className={shell} aria-live="polite" data-e2e-birads-result>
      <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">BI-RADS · результат</p>
      {result.final ? (
        <div className={cn("rounded-xl border px-3 py-2", tone(result.final.category))}>
          <p className="text-xl font-black" data-e2e-birads-category>
            {result.final.labelRu}
          </p>
          <p className="text-xs">Вероятность злокачественности: {result.final.likelihoodRu}</p>
          <p className="mt-1 text-sm font-semibold">{result.final.managementRu}</p>
          <p className="mt-1 text-[11px] opacity-80">{result.finalSource === "doctor" ? "Категория выбрана врачом" : "Категория по критериям ACR"}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
          <p className="text-lg font-black" data-e2e-birads-category>
            {options.every((o) => ["4A", "4B", "4C", "5"].includes(o)) ? "≥ BI-RADS 4 · выберите категорию" : "Выберите категорию"}
          </p>
        </div>
      )}

      <p className="text-sm text-[var(--clinical-foreground)]">{result.pathway.reasonRu}</p>

      {result.suspiciousFeatures.length ? (
        <ul className="list-inside list-disc text-xs text-[var(--clinical-foreground-muted)]">
          {result.suspiciousFeatures.map((s) => (
            <li key={s}>{BIRADS_SUSPICIOUS_LABEL_RU[s]}</li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Категория врача</p>
        <div className="flex flex-wrap gap-2">
          {choices.map((c) => (
            <CalcChip
              key={c}
              label={`BI-RADS ${c}`}
              selected={doctorCategory === c}
              onClick={() => onDoctorCategory(doctorCategory === c ? undefined : c)}
            />
          ))}
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Только варианты по признакам" : "Другая категория (0, 1, 6 и др.)"}
        </button>
        {doctorCategory ? (
          <p className="text-[11px] text-[var(--clinical-foreground-muted)]">{BIRADS_CATEGORY_INFO[doctorCategory].labelRu}</p>
        ) : null}
      </div>

      {result.notesRu.length ? (
        <ul className="space-y-1.5">
          {result.notesRu.map((n) => (
            <li
              key={n}
              className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-[11px] text-[var(--clinical-foreground-muted)]">Источник: {result.source.citation}</p>
    </section>
  );
}
