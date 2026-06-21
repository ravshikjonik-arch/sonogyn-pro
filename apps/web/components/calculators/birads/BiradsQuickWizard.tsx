"use client";

import { useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { BiradsImageAssistPanel } from "@/components/calculators/birads/BiradsImageAssistPanel";
import { useBiradsFlow } from "@/components/calculators/birads/BiradsFlowContext";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BI_RADS_VERSION,
  biradsOptions,
  brochureOptions,
  generateStructuredReport,
  type BiradsBrochureInput,
} from "@/lib/birads-us";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

const QUICK_STEPS = [
  { id: 1, title: "GTC / состав" },
  { id: 2, title: "Образование" },
  { id: 3, title: "Кальцинаты / признаки" },
  { id: 4, title: "Лимфоузлы" },
  { id: 5, title: "Результат" },
] as const;

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

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
      {options.map((opt) => (
        <CalcChip
          key={opt.value}
          label={opt.label}
          selected={selected.includes(opt.value)}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}

/** Быстрый 5-шаговый калькулятор BI-RADS US. */
export function BiradsQuickWizard() {
  const { input, setInput, quickStep: step, setQuickStep: setStep, applySource, applyFromAi } = useBiradsFlow();
  const [pending, startTransition] = useTransition();

  const setField = useCallback(<K extends keyof BiradsBrochureInput>(key: K, value: BiradsBrochureInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, [setInput]);

  const report = useMemo(() => generateStructuredReport(input), [input]);
  const { engine } = report;

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `birads-quick-${engine.category.replace(/\s+/g, "-")}`,
        title: `BI-RADS US · ${engine.category}`,
        meta: [
          { label: "Режим", value: "Быстрый калькулятор" },
          { label: "Ruleset", value: BI_RADS_VERSION },
        ],
        text: report.fullProtocol,
      }),
    [engine.category, report.fullProtocol],
  );

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "bi-rads",
        calculatorCode: "BI_RADS_US_QUICK",
        payload: { input, report, engine },
        summary: `${engine.category} · быстрый режим`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории");
        else toast.error(res.message);
      });
    });
  }

  const shapeOptions = biradsOptions.shape ?? [];
  const posteriorOptions = biradsOptions.posteriorFeatures ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <div>
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">BI-RADS US · быстрый режим</p>
        <h2 className="text-xl font-black">Калькулятор BI-RADS</h2>
        {applySource ? (
          <p className="mt-1 text-xs font-semibold text-rose-700">
            Источник: {applySource.label}
            {applySource.mergedText ? " · данные из AI/worker" : ""}
          </p>
        ) : null}
      </div>

      <BiradsImageAssistPanel onResult={(r) => applyFromAi(r, "quick")} />

      <nav className="flex flex-wrap gap-1">
        {QUICK_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              step === s.id
                ? "bg-rose-600 text-white"
                : "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]",
            )}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </nav>

      {step === 1 ? (
        <CalcStepCard title="Шаг 1 — Состав молочной железы (GTC)">
          <CalcSubLabel>Железистая ткань (GTC)</CalcSubLabel>
          <ChipField
            options={brochureOptions.gtcAmount}
            value={input.gtcAmount}
            onChange={(v) => setField("gtcAmount", v)}
          />
        </CalcStepCard>
      ) : null}

      {step === 2 ? (
        <CalcStepCard title="Шаг 2 — Описание образования">
          <CalcSubLabel>Форма</CalcSubLabel>
          <ChipField options={shapeOptions} value={input.shape} onChange={(v) => setField("shape", v)} />
          <CalcSubLabel>Ориентация</CalcSubLabel>
          <ChipField
            options={biradsOptions.orientation}
            value={input.orientation}
            onChange={(v) => setField("orientation", v)}
          />
          <CalcSubLabel>Контуры</CalcSubLabel>
          <ChipField options={biradsOptions.margin} value={input.margin} onChange={(v) => setField("margin", v)} />
          <CalcSubLabel>Эхогенность</CalcSubLabel>
          <ChipField
            options={biradsOptions.echoPattern}
            value={input.echoPattern}
            onChange={(v) => setField("echoPattern", v)}
          />
          <CalcSubLabel>Задние акустические эффекты</CalcSubLabel>
          <ChipField
            options={posteriorOptions}
            value={input.posteriorFeatures}
            onChange={(v) => setField("posteriorFeatures", v)}
          />
          <CalcSubLabel>Васкуляризация</CalcSubLabel>
          <ChipField
            options={biradsOptions.vascularity}
            value={input.vascularity}
            onChange={(v) => setField("vascularity", v)}
          />
        </CalcStepCard>
      ) : null}

      {step === 3 ? (
        <CalcStepCard title="Шаг 3 — Кальцинаты и ассоциированные признаки">
          <CalcSubLabel>Кальцинаты</CalcSubLabel>
          <ChipField
            options={brochureOptions.calcifications}
            value={input.calcifications}
            onChange={(v) => setField("calcifications", v)}
          />
          <CalcSubLabel>Ассоциированные признаки</CalcSubLabel>
          <ChipField
            options={brochureOptions.associatedFeatures}
            value={input.associatedFeatures}
            onChange={(v) => setField("associatedFeatures", toggleInList(input.associatedFeatures ?? [], v))}
            multi
          />
          <CalcSubLabel>Эластография</CalcSubLabel>
          <ChipField
            options={brochureOptions.elastographyStiffness}
            value={input.elastographyStiffness}
            onChange={(v) => setField("elastographyStiffness", v)}
          />
        </CalcStepCard>
      ) : null}

      {step === 4 ? (
        <CalcStepCard title="Шаг 4 — Регионарные лимфоузлы">
          <CalcSubLabel>Локализация</CalcSubLabel>
          <ChipField
            options={brochureOptions.lymphNodeSites}
            value={input.lymphNodeSites}
            onChange={(v) => setField("lymphNodeSites", toggleInList(input.lymphNodeSites ?? [], v))}
            multi
          />
          <CalcSubLabel>Кора</CalcSubLabel>
          <ChipField
            options={brochureOptions.lymphNodeCortex}
            value={input.lymphNodeCortex}
            onChange={(v) => setField("lymphNodeCortex", v)}
          />
          <CalcSubLabel>Ворота</CalcSubLabel>
          <ChipField
            options={brochureOptions.lymphNodeHilum}
            value={input.lymphNodeHilum}
            onChange={(v) => setField("lymphNodeHilum", v)}
          />
        </CalcStepCard>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-3xl font-black text-rose-800">{engine.category}</span>
              <Badge variant="outline">риск {engine.malignancyRisk}</Badge>
              {engine.biopsyRecommended ? (
                <Badge className="bg-amber-100 text-amber-900">Биопсия</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-semibold">{engine.management}</p>
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{engine.followUp}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending} onClick={onSave}>
              {pending ? "Сохранение…" : "Сохранить в истории"}
            </Button>
            <DocumentExportToolbar spec={exportSpec} />
          </div>

          {engine.matchedPathologies.length > 0 ? (
            <CalcStepCard title="Дифференциальный диагноз">
              <ul className="space-y-2 text-sm">
                {engine.matchedPathologies.map((p) => (
                  <li key={p.id} className="rounded-lg border border-[var(--clinical-border)] p-2">
                    <span className="font-bold">{p.nameRu}</span>
                    <span className="ml-2 text-xs text-[var(--clinical-foreground-muted)]">{p.typicalBirads}</span>
                    <p className="mt-1 text-xs">{p.educationSummary}</p>
                  </li>
                ))}
              </ul>
            </CalcStepCard>
          ) : null}

          <CalcStepCard title="Обоснование">
            <ul className="list-inside list-disc text-xs leading-relaxed">
              {engine.reasoning.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CalcStepCard>

          <CalcStepCard title="Структурированный протокол">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed">{report.fullProtocol}</pre>
          </CalcStepCard>
        </div>
      ) : null}

      <div className="flex justify-between gap-2 pb-24">
        <Button type="button" variant="outline" disabled={step <= 1} onClick={() => setStep((s) => s - 1)}>
          Назад
        </Button>
        {step < 5 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            Далее
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setStep(1)}>
            Начать заново
          </Button>
        )}
      </div>
    </div>
  );
}
