"use client";

import { useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { useTiradsFlow } from "@/components/calculators/tirads/TiradsFlowContext";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COMPOSITION_OPTIONS,
  ECHOGENICITY_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  evaluateAcrTirads,
  generateStructuredThyroidReport,
  type TiradsAcrInput,
} from "@/lib/tirads-acr";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  "Composition",
  "Echogenicity",
  "Shape",
  "Margins",
  "Echogenic foci",
  "Size",
  "Lymph nodes",
  "Result",
] as const;

function ChipField<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; labelRu: string; points: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <CalcChip
          key={o.value}
          label={`${o.labelRu} (+${o.points})`}
          selected={value === o.value}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}

const LN_OPTS = [
  { value: "not_assessed", label: "Не оценивались" },
  { value: "benign", label: "Доброкачественные" },
  { value: "indeterminate", label: "Неопределённые" },
  { value: "suspicious", label: "Подозрительные" },
] as const;

export function TiradsAcrWizard() {
  const { input, setInput, step, setStep, applySource } = useTiradsFlow();
  const [pending, startTransition] = useTransition();

  const setField = useCallback(
    <K extends keyof TiradsAcrInput>(key: K, value: TiradsAcrInput[K]) => {
      setInput((prev) => ({ ...prev, [key]: value }));
    },
    [setInput],
  );

  const report = useMemo(() => generateStructuredThyroidReport(input), [input]);
  const { result } = report;

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `tirads-acr-${result.category}`,
        title: `ACR TI-RADS · ${result.category}`,
        meta: [
          { label: "Баллы", value: String(result.totalPoints) },
          { label: "FNA", value: result.fnaRecommended ? "да" : "нет" },
        ],
        text: report.fullProtocol,
      }),
    [report.fullProtocol, result],
  );

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "ti-rads",
        calculatorCode: "TI_RADS_ACR",
        payload: { input, report, result },
        summary: `${result.category} · ${result.totalPoints} pts`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <div>
        <h2 className="text-xl font-black">ACR TI-RADS · калькulator</h2>
        {applySource ? <p className="text-xs font-semibold text-sky-800">Источник: {applySource}</p> : null}
      </div>

      <nav className="flex flex-wrap gap-1">
        {STEPS.map((title, i) => (
          <button
            key={title}
            type="button"
            onClick={() => setStep(i + 1)}
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-bold sm:text-xs",
              step === i + 1 ? "bg-sky-700 text-white" : "bg-[var(--clinical-muted)]",
            )}
          >
            {i + 1}. {title}
          </button>
        ))}
      </nav>

      {step === 1 ? (
        <CalcStepCard title="Шаг 1 — Composition">
          <ChipField options={COMPOSITION_OPTIONS} value={input.composition} onChange={(v) => setField("composition", v)} />
        </CalcStepCard>
      ) : null}
      {step === 2 ? (
        <CalcStepCard title="Шаг 2 — Echogenicity">
          <ChipField options={ECHOGENICITY_OPTIONS} value={input.echogenicity} onChange={(v) => setField("echogenicity", v)} />
        </CalcStepCard>
      ) : null}
      {step === 3 ? (
        <CalcStepCard title="Шаг 3 — Shape">
          <ChipField options={SHAPE_OPTIONS} value={input.shape} onChange={(v) => setField("shape", v)} />
        </CalcStepCard>
      ) : null}
      {step === 4 ? (
        <CalcStepCard title="Шаг 4 — Margins">
          <ChipField options={MARGIN_OPTIONS} value={input.margin} onChange={(v) => setField("margin", v)} />
        </CalcStepCard>
      ) : null}
      {step === 5 ? (
        <CalcStepCard title="Шаг 5 — Echogenic foci">
          <ChipField options={ECHOGENIC_FOCI_OPTIONS} value={input.echogenicFoci} onChange={(v) => setField("echogenicFoci", v)} />
        </CalcStepCard>
      ) : null}
      {step === 6 ? (
        <CalcStepCard title="Шаг 6 — Size & protocol">
          <CalcSubLabel>Наибольший диаметр (мм)</CalcSubLabel>
          <Input
            type="number"
            min={1}
            max={80}
            value={input.largestDiameterMm ?? ""}
            onChange={(e) => setField("largestDiameterMm", e.target.value ? Number(e.target.value) : undefined)}
          />
          <CalcSubLabel>Локализация узла</CalcSubLabel>
          <Input value={input.noduleLocation ?? ""} onChange={(e) => setField("noduleLocation", e.target.value)} placeholder="правая доля, верхний полюс" />
        </CalcStepCard>
      ) : null}
      {step === 7 ? (
        <CalcStepCard title="Шаг 7 — Lymph nodes">
          <div className="flex flex-wrap gap-2">
            {LN_OPTS.map((o) => (
              <CalcChip
                key={o.value}
                label={o.label}
                selected={input.lymphNodes === o.value}
                onClick={() => setField("lymphNodes", o.value)}
              />
            ))}
          </div>
        </CalcStepCard>
      ) : null}
      {step === 8 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-5">
            <div className="flex flex-wrap gap-2">
              <span className="text-3xl font-black text-sky-900">{result.category}</span>
              <Badge>{result.totalPoints} баллов</Badge>
              <Badge variant="outline">риск {result.malignancyRisk}</Badge>
            </div>
            <p className="mt-2 text-sm">{result.fnaRecommended ? "FNA рекомендована" : "FNA не показана"} — {result.fnaRationale}</p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{result.followUpRecommendation}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={pending}>Сохранить</Button>
            <DocumentExportToolbar spec={exportSpec} />
          </div>
          <CalcStepCard title="Баллы">
            <ul className="text-xs">
              {result.rationale.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CalcStepCard>
          <CalcStepCard title="Протокол">
            <pre className="whitespace-pre-wrap text-xs">{report.fullProtocol}</pre>
          </CalcStepCard>
        </div>
      ) : null}

      <div className="flex justify-between pb-24">
        <Button variant="outline" disabled={step <= 1} onClick={() => setStep((s) => s - 1)}>Назад</Button>
        {step < 8 ? <Button onClick={() => setStep((s) => s + 1)}>Далее</Button> : <Button variant="secondary" onClick={() => setStep(1)}>Заново</Button>}
      </div>
    </div>
  );
}
