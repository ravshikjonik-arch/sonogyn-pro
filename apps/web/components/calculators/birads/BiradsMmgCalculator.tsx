"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BIRADS_MMG_CATEGORY_RECOMMENDATIONS,
  BIRADS_MMG_DISCLAIMER,
  BIRADS_MMG_SOURCE,
  BIRADS_MMG_STEPS,
  buildBiradsMmgProtocol,
  defaultBiradsMmgInput,
  evaluateBiradsMmg,
  mmgOptions,
  type BiradsCategoryCode,
  type BiradsMmgFindingType,
  type BiradsMmgInput,
} from "@/lib/birads-mmg";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

function ChipField({
  options,
  value,
  onChange,
  multi,
}: {
  options: { value: string; label: string }[];
  value: string | string[] | undefined;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  const selected = multi ? (Array.isArray(value) ? value : []) : [value].filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-semibold transition",
              isActive
                ? "border-rose-500 bg-rose-600 text-white shadow-sm"
                : "border-[var(--clinical-border)] bg-white hover:border-rose-300 hover:bg-rose-50",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

type Props = {
  onCategoryChange?: (category: string) => void;
};

/** Визард BI-RADS Mammography — отдельный блок ММГ для врача. */
export function BiradsMmgCalculator({ onCategoryChange }: Props) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<BiradsMmgInput>(defaultBiradsMmgInput);
  const [pending, startTransition] = useTransition();

  const setField = useCallback(<K extends keyof BiradsMmgInput>(key: K, value: BiradsMmgInput[K]) => {
    setInput((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  }, []);

  const result = useMemo(() => evaluateBiradsMmg(input), [input]);
  const protocol = useMemo(() => buildBiradsMmgProtocol(input), [input]);

  useEffect(() => {
    onCategoryChange?.(result.category);
  }, [result.category, onCategoryChange]);

  function toggleAssoc(value: string) {
    const list = input.associatedFeatures ?? [];
    setField(
      "associatedFeatures",
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "bi-rads-mmg",
        calculatorCode: "BI_RADS_MMG",
        payload: { input, result },
        summary: `${result.category} · ММГ`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Маммография · для врачей</p>
        <h2 className="text-2xl font-black tracking-tight">BI-RADS Mammography</h2>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{BIRADS_MMG_SOURCE}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">ACR Atlas 5th Ed</Badge>
          <Badge variant="outline">CDS · не диагноз</Badge>
        </div>
      </header>

      <div className="flex flex-wrap gap-1">
        {BIRADS_MMG_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              step === s.id ? "bg-rose-700 text-white" : "bg-rose-50 text-rose-900",
            )}
          >
            {s.id}. {s.subtitle}
          </button>
        ))}
      </div>

      {step === 1 ? (
        <CalcStepCard title="Плотность паренхимы (ACR A–D)" required>
          <ChipField
            options={mmgOptions.breastComposition}
            value={input.breastComposition}
            onChange={(v) => setField("breastComposition", v)}
          />
          <Textarea
            rows={2}
            placeholder="Локализация (квадрант, часы, глубина) — опционально"
            value={input.localizationText ?? ""}
            onChange={(e) => setField("localizationText", e.target.value)}
            className="text-sm"
          />
        </CalcStepCard>
      ) : null}

      {step === 2 ? (
        <CalcStepCard title="Тип находки" required>
          <ChipField
            options={mmgOptions.findingType}
            value={input.findingType}
            onChange={(v) => setField("findingType", v as BiradsMmgFindingType)}
          />
        </CalcStepCard>
      ) : null}

      {step === 3 ? (
        <CalcStepCard title="Дескрипторы по типу находки" required>
          {input.findingType === "mass" ? (
            <div className="space-y-3">
              <p className="text-xs font-bold">Форма</p>
              <ChipField options={mmgOptions.massShape} value={input.massShape} onChange={(v) => setField("massShape", v)} />
              <p className="text-xs font-bold">Край</p>
              <ChipField options={mmgOptions.massMargin} value={input.massMargin} onChange={(v) => setField("massMargin", v)} />
              <p className="text-xs font-bold">Плотность mass</p>
              <ChipField options={mmgOptions.massDensity} value={input.massDensity} onChange={(v) => setField("massDensity", v)} />
            </div>
          ) : null}
          {input.findingType === "calcifications" ? (
            <div className="space-y-3">
              <p className="text-xs font-bold">Морфология</p>
              <ChipField
                options={mmgOptions.calcMorphology}
                value={input.calcMorphology}
                onChange={(v) => setField("calcMorphology", v)}
              />
              <p className="text-xs font-bold">Распределение</p>
              <ChipField
                options={mmgOptions.calcDistribution}
                value={input.calcDistribution}
                onChange={(v) => setField("calcDistribution", v)}
              />
            </div>
          ) : null}
          {input.findingType === "asymmetry" ? (
            <ChipField
              options={mmgOptions.asymmetryType}
              value={input.asymmetryType}
              onChange={(v) => setField("asymmetryType", v)}
            />
          ) : null}
          {input.findingType === "negative" ||
          input.findingType === "architectural_distortion" ||
          input.findingType === "associated_only" ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">
              Для этого типа находки дополнительные дескрипторы mass/calc не обязательны — перейдите к ассоциированным
              признакам и категории.
            </p>
          ) : null}
        </CalcStepCard>
      ) : null}

      {step === 4 ? (
        <CalcStepCard title="Ассоциированные признаки">
          <ChipField
            options={mmgOptions.associatedFeatures}
            value={input.associatedFeatures}
            multi
            onChange={toggleAssoc}
          />
        </CalcStepCard>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <CalcStepCard title="Сравнение с предыдущими">
            <ChipField
              options={mmgOptions.comparison}
              value={input.comparison}
              onChange={(v) => setField("comparison", v)}
            />
          </CalcStepCard>
          <CalcStepCard title="Категория BI-RADS (подтверждение врача)" required>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Автоподсказка: {result.category}
              {result.suggestedAutomatically ? " · эвристика CDS" : " · ручная"}. Врач может переопределить.
            </p>
            <ChipField
              options={mmgOptions.categories}
              value={input.biradsCategoryManual ?? result.categoryCode}
              onChange={(v) => setField("biradsCategoryManual", v as BiradsCategoryCode)}
            />
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
              <p className="text-lg font-black text-rose-900">{result.category}</p>
              <p className="text-sm text-rose-900/80">Риск ЗНО: {result.riskRange}</p>
              <p className="mt-1 text-sm">{result.impression}</p>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold">Таблица тактики по категориям</summary>
              <ul className="mt-2 space-y-1 text-[var(--clinical-foreground-muted)]">
                {Object.entries(BIRADS_MMG_CATEGORY_RECOMMENDATIONS).map(([code, rec]) => (
                  <li key={code}>
                    <span className="font-bold">BI-RADS {code}:</span> {rec}
                  </li>
                ))}
              </ul>
            </details>
            <Textarea
              rows={3}
              placeholder="Комментарий / формулировка заключения"
              value={input.conclusionDraft ?? ""}
              onChange={(e) => setField("conclusionDraft", e.target.value)}
            />
          </CalcStepCard>
          <CalcStepCard title="Протокол">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--clinical-surface)] p-3 text-xs">
              {protocol}
            </pre>
            <DocumentExportToolbar
              spec={plainTextToDocumentSpec({
                filenameBase: `bi-rads-mmg-${result.categoryCode}`,
                title: `Протокол ММГ · ${result.category}`,
                text: protocol,
              })}
            />
            <Button type="button" onClick={onSave} disabled={pending}>
              Сохранить
            </Button>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{BIRADS_MMG_DISCLAIMER}</p>
          </CalcStepCard>
        </div>
      ) : null}

      <div className="flex justify-between gap-2 pb-8">
        <Button type="button" variant="outline" disabled={step <= 1} onClick={() => setStep((s) => s - 1)}>
          Назад
        </Button>
        <Button type="button" disabled={step >= 5} onClick={() => setStep((s) => s + 1)}>
          Далее
        </Button>
      </div>
    </div>
  );
}
