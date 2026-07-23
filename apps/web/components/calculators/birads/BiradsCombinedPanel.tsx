"use client";

import { useEffect, useMemo, useState } from "react";

import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BIRADS_MMG_CATEGORY_RECOMMENDATIONS,
  BIRADS_MMG_DISCLAIMER,
  combineBiradsCategories,
  type BiradsCategoryCode,
} from "@/lib/birads-mmg";
import { cn } from "@/lib/utils/cn";

type Props = {
  usCategory?: string | null;
  mmgCategory?: string | null;
  onGoUs?: () => void;
  onGoMmg?: () => void;
};

const MANUAL_CODES: BiradsCategoryCode[] = ["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"];

/** Комбинированное заключение УЗИ + ММГ молочных желёз. */
export function BiradsCombinedPanel({ usCategory, mmgCategory, onGoUs, onGoMmg }: Props) {
  const [usLocal, setUsLocal] = useState(usCategory ?? "");
  const [mmgLocal, setMmgLocal] = useState(mmgCategory ?? "");
  const [manualFinal, setManualFinal] = useState<BiradsCategoryCode | "">("");

  useEffect(() => {
    if (usCategory) setUsLocal(usCategory);
  }, [usCategory]);

  useEffect(() => {
    if (mmgCategory) setMmgLocal(mmgCategory);
  }, [mmgCategory]);

  const combined = useMemo(
    () => combineBiradsCategories({ usCategory: usLocal, mmgCategory: mmgLocal }),
    [usLocal, mmgLocal],
  );

  const finalCode = manualFinal || combined.suggestedCode;
  const finalRec = BIRADS_MMG_CATEGORY_RECOMMENDATIONS[finalCode] ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Комбо · для врачей</p>
        <h2 className="text-2xl font-black tracking-tight">УЗИ + ММГ · итог BI-RADS</h2>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Два независимых блока → одна итоговая категория. Правило подсказки: более подозрительная; при 0 на стороне —
          дообследование.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">CDS</Badge>
          <Badge variant="outline">врач подтверждает</Badge>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <CalcStepCard title="УЗИ молочных желёз">
          <Input
            value={usLocal}
            onChange={(e) => setUsLocal(e.target.value)}
            placeholder="Напр. BI-RADS 3"
            className="text-sm"
          />
          {onGoUs ? (
            <button type="button" className="text-xs font-semibold text-rose-800 underline" onClick={onGoUs}>
              Открыть блок УЗИ
            </button>
          ) : null}
        </CalcStepCard>
        <CalcStepCard title="ММГ молочных желёз">
          <Input
            value={mmgLocal}
            onChange={(e) => setMmgLocal(e.target.value)}
            placeholder="Напр. BI-RADS 4A"
            className="text-sm"
          />
          {onGoMmg ? (
            <button type="button" className="text-xs font-semibold text-rose-800 underline" onClick={onGoMmg}>
              Открыть блок ММГ
            </button>
          ) : null}
        </CalcStepCard>
      </div>

      <CalcStepCard title="Итоговая категория">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{combined.reasonRu}</p>
        <p className="text-lg font-black text-rose-900">
          Подсказка: BI-RADS {combined.suggestedCode}
          {combined.needsCompletion ? " · нужна дооценка" : ""}
        </p>
        <p className="text-xs font-bold">Подтверждение врача</p>
        <div className="flex flex-wrap gap-2">
          {MANUAL_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setManualFinal(code)}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold",
                finalCode === code
                  ? "border-rose-500 bg-rose-600 text-white"
                  : "border-[var(--clinical-border)] bg-white hover:bg-rose-50",
              )}
            >
              {code}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
          <p className="text-xl font-black text-rose-900">BI-RADS {finalCode}</p>
          <p className="mt-1 text-sm">{finalRec}</p>
        </div>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{BIRADS_MMG_DISCLAIMER}</p>
      </CalcStepCard>
    </div>
  );
}
