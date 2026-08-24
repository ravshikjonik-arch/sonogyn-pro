"use client";

import { formatMm, parseMeasurementMm } from "@repo/medical-calculations";
import type { TiradsEchogenicFoci } from "@repo/tirads-acr";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ACR_TIRADS_ENGINE_VERSION,
  COMPOSITION_OPTIONS,
  ECHOGENICITY_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  evaluateAcrTirads,
  generateStructuredThyroidReport,
  normalizeEchogenicFoci,
  type TiradsAcrInput,
} from "@/lib/tirads-acr";
import { saveTiradsBridgePayload } from "@/lib/reports/sre-tirads-bridge";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

const ANALYSIS_STEPS = [
  "Composition",
  "Echogenicity",
  "Shape",
  "Margins",
  "Echogenic foci",
  "Size",
  "Lymph nodes",
] as const;

const PHASES = [
  { id: "analysis", label: "Анализ", stepRange: [1, 7] as const },
  { id: "report", label: "Доклад", stepRange: [8, 8] as const },
  { id: "store", label: "Store", stepRange: [8, 8] as const },
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

function MultiFociField({
  value,
  onChange,
}: {
  value: TiradsEchogenicFoci[];
  onChange: (v: TiradsEchogenicFoci[]) => void;
}) {
  const selected = normalizeEchogenicFoci(value);

  function toggle(focus: TiradsEchogenicFoci) {
    if (focus === "none_or_comet_tail") {
      onChange(["none_or_comet_tail"]);
      return;
    }
    const withoutNone = selected.filter((f) => f !== "none_or_comet_tail");
    if (withoutNone.includes(focus)) {
      const next = withoutNone.filter((f) => f !== focus);
      onChange(next.length ? next : ["none_or_comet_tail"]);
      return;
    }
    onChange([...withoutNone, focus]);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        ACR: отметьте все применимые варианты — баллы суммируются.
      </p>
      <div className="flex flex-wrap gap-2">
        {ECHOGENIC_FOCI_OPTIONS.map((o) => (
          <CalcChip
            key={o.value}
            label={`${o.labelRu} (+${o.points})`}
            selected={selected.includes(o.value)}
            onClick={() => toggle(o.value)}
          />
        ))}
      </div>
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
  const router = useRouter();
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
  const live = useMemo(() => evaluateAcrTirads(input), [input]);

  const phaseId = step <= 7 ? "analysis" : "report";

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `tirads-acr-${result.category}`,
        title: `ACR TI-RADS · ${result.category}`,
        meta: [
          { label: "Баллы", value: String(result.totalPoints) },
          { label: "FNA", value: result.fnaRecommended ? "да" : "нет" },
          { label: "Engine", value: result.engineVersion ?? ACR_TIRADS_ENGINE_VERSION },
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
        if (res.ok) toast.success("Сохранено в историю калькулятора");
        else toast.error(res.message);
      });
    });
  }

  function openStructuredReport() {
    saveTiradsBridgePayload({
      input,
      result: {
        category: result.category,
        categoryLabel: result.categoryLabel,
        totalPoints: result.totalPoints,
        malignancyRisk: result.malignancyRisk,
        fnaRecommended: result.fnaRecommended,
        fnaRationale: result.fnaRationale,
        followUpRecommendation: result.followUpRecommendation,
        engineVersion: result.engineVersion,
      },
    });
    toast.message("Данные переданы в структурированный доклад");
    router.push("/reports/thyroid");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <div>
        <h2 className="text-xl font-black">ACR TI-RADS · Анализ → Доклад → Store</h2>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          {ACR_TIRADS_ENGINE_VERSION} · клиническая поддержка, не диагноз
        </p>
        {applySource ? <p className="text-xs font-semibold text-sky-800">Источник: {applySource}</p> : null}
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Фазы TI-RADS">
        {PHASES.map((phase) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => setStep(phase.id === "analysis" ? Math.min(step, 7) || 1 : 8)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold",
              phaseId === phase.id || (phase.id === "store" && step === 8)
                ? "bg-sky-700 text-white"
                : "bg-[var(--clinical-muted)]",
            )}
          >
            {phase.label}
          </button>
        ))}
      </nav>

      {step <= 7 ? (
        <nav className="flex flex-wrap gap-1">
          {ANALYSIS_STEPS.map((title, i) => (
            <button
              key={title}
              type="button"
              onClick={() => setStep(i + 1)}
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-bold sm:text-xs",
                step === i + 1 ? "bg-cyan-800 text-white" : "bg-[var(--clinical-muted)]",
              )}
            >
              {i + 1}. {title}
            </button>
          ))}
        </nav>
      ) : null}

      {step <= 7 ? (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950">
          Черновик: <strong>{live.category}</strong> · {live.totalPoints} баллов
          {input.largestDiameterMm != null ? ` · ${formatMm(input.largestDiameterMm)}` : ""}
        </p>
      ) : null}

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
          <MultiFociField value={input.echogenicFoci} onChange={(v) => setField("echogenicFoci", v)} />
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
            onChange={(e) => setField("largestDiameterMm", e.target.value ? parseMeasurementMm(e.target.value) : undefined)}
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
            <p className="text-[10px] font-bold uppercase tracking-wide text-sky-800">Доклад</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="text-3xl font-black text-sky-900">{result.category}</span>
              <Badge>{result.totalPoints} баллов</Badge>
              <Badge variant="outline">риск {result.malignancyRisk}</Badge>
            </div>
            <p className="mt-2 text-sm">
              {result.fnaRecommended ? "FNA рекомендована" : "FNA не показана"} — {result.fnaRationale}
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{result.followUpRecommendation}</p>
            <p className="mt-2 text-[11px] text-[var(--clinical-foreground-muted)]">
              Рекомендация CDS по ACR TI-RADS; не является диагнозом. Интерпретация — специалистом.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--clinical-border)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Store
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button onClick={openStructuredReport}>Структурированный доклад</Button>
              <Button variant="secondary" onClick={onSave} disabled={pending}>
                Сохранить в историю
              </Button>
              <Button variant="outline" asChild>
                <Link href="/cases?tab=cases&playlist=tirads-thyroid">Кейсы TI-RADS</Link>
              </Button>
              <DocumentExportToolbar spec={exportSpec} />
            </div>
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
        <Button variant="outline" disabled={step <= 1} onClick={() => setStep((s) => s - 1)}>
          Назад
        </Button>
        {step < 8 ? (
          <Button onClick={() => setStep((s) => s + 1)}>{step === 7 ? "К докладу" : "Далее"}</Button>
        ) : (
          <Button variant="secondary" onClick={() => setStep(1)}>
            Заново
          </Button>
        )}
      </div>
    </div>
  );
}
