"use client";

import { useMemo, useState } from "react";

import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { NomogramChart } from "@/components/calculators/ob/NomogramChart";
import {
  NOMOGRAM_CATEGORY_LABELS,
  NOMOGRAM_DECISION_TREE,
  NOMOGRAM_DISCLAIMER,
  NOMOGRAM_WIZARD_START,
  buildDecisionTreePath,
  buildNomogramChartSeries,
  evaluateNomogram,
  evaluateTrisomyScore,
  listClinicalDefinitions,
  listNomogramsByCategory,
  nextInputStepForNomogram,
  type Nomogram,
  type NomogramCategory,
  type NomogramDecisionNodeId,
} from "@repo/fetal-nomograms";

const FLAG_LABELS: Record<string, string> = {
  BELOW_P5: "Ниже нижней границы",
  P5_P50: "Ниже медианы",
  P50_P95: "В пределах центрального коридора",
  ABOVE_P95: "Выше верхней границы",
  BELOW_MIN: "Ниже min",
  LOW_MEAN: "Ниже mean low",
  WITHIN_MEAN: "Средний референс",
  HIGH_MEAN: "Выше mean high",
  ABOVE_MAX: "Выше max",
  BELOW_MOM_THRESHOLD: "Ниже порога MoM",
  AT_OR_ABOVE_MOM_THRESHOLD: "≥ порога MoM",
  out_of_range: "Вне диапазона",
  unknown: "Недостаточно данных",
};

export function NomogramDecisionWizard() {
  const [step, setStep] = useState<NomogramDecisionNodeId>(NOMOGRAM_WIZARD_START);
  const [category, setCategory] = useState<NomogramCategory | null>(null);
  const [nomogram, setNomogram] = useState<Nomogram | null>(null);
  const [gaWeeks, setGaWeeks] = useState("20");
  const [gaDays, setGaDays] = useState("0");
  const [crlMm, setCrlMm] = useState("");
  const [value, setValue] = useState("");
  const [trisomySelected, setTrisomySelected] = useState<string[]>([]);

  const node = NOMOGRAM_DECISION_TREE[step];
  const nomogramsInCategory = useMemo(
    () => (category ? listNomogramsByCategory(category) : []),
    [category],
  );

  const gaWeeksDecimal = useMemo(() => {
    const w = Number.parseInt(gaWeeks, 10);
    const d = Number.parseInt(gaDays, 10);
    if (!Number.isFinite(w)) return undefined;
    return w + (Number.isFinite(d) ? d / 7 : 0);
  }, [gaWeeks, gaDays]);

  const measureValue = useMemo(() => {
    const v = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(v) ? v : undefined;
  }, [value]);

  const crl = useMemo(() => {
    const v = Number.parseFloat(crlMm.replace(",", "."));
    return Number.isFinite(v) ? v : undefined;
  }, [crlMm]);

  const nomogramResult = useMemo(() => {
    if (step !== "enter_value" || !nomogram || measureValue == null) return null;
    return evaluateNomogram({
      nomogramId: nomogram.id,
      gaWeeksDecimal: nomogram.x_axis.type !== "crl_range_mm" ? gaWeeksDecimal : undefined,
      crlMm: nomogram.x_axis.type === "crl_range_mm" ? crl : undefined,
      value: measureValue,
    });
  }, [step, nomogram, measureValue, gaWeeksDecimal, crl]);

  const trisomyResult = useMemo(() => {
    if (step !== "trisomy_score") return null;
    return evaluateTrisomyScore({ selectedSigns: trisomySelected });
  }, [step, trisomySelected]);

  const chartSeries = useMemo(
    () => (nomogram ? buildNomogramChartSeries(nomogram.id) : null),
    [nomogram],
  );

  const chartMarker = useMemo(() => {
    if (!nomogram || measureValue == null) return undefined;
    if (nomogram.x_axis.type === "crl_range_mm") {
      return crl != null ? { x: crl, y: measureValue } : undefined;
    }
    return gaWeeksDecimal != null ? { x: gaWeeksDecimal, y: measureValue } : undefined;
  }, [nomogram, measureValue, gaWeeksDecimal, crl]);

  const clinicalDefs = useMemo(() => listClinicalDefinitions(), []);

  const treePath = useMemo(() => {
    if (step === "trisomy_score" && trisomyResult?.ok) {
      return buildDecisionTreePath({
        categoryLabel: "Риск трисомий",
        resultSummary: trisomyResult.summary,
      });
    }
    return buildDecisionTreePath({
      categoryLabel: category ? NOMOGRAM_CATEGORY_LABELS[category] : undefined,
      nomogramTitle: nomogram?.title,
      gaLabel:
        nomogram?.x_axis.type === "crl_range_mm"
          ? crl != null
            ? `КТР ${crl} мм`
            : undefined
          : gaWeeksDecimal != null
            ? `${gaWeeksDecimal.toFixed(2)} нед`
            : undefined,
      valueLabel: measureValue != null ? `${measureValue} ${nomogram?.unit ?? ""}` : undefined,
      resultSummary: nomogramResult?.summary,
    });
  }, [
    category,
    nomogram,
    gaWeeksDecimal,
    crl,
    measureValue,
    nomogramResult,
    step,
    trisomyResult,
  ]);

  function resetWizard() {
    setStep(NOMOGRAM_WIZARD_START);
    setCategory(null);
    setNomogram(null);
    setTrisomySelected([]);
    setValue("");
  }

  function pickCategory(cat: NomogramCategory) {
    setCategory(cat);
    setNomogram(null);
    setStep("pick_nomogram");
  }

  function pickNomogram(n: Nomogram) {
    setNomogram(n);
    setStep(nextInputStepForNomogram(n.x_axis.type));
  }

  function toggleTrisomy(sign: string) {
    setTrisomySelected((prev) => (prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign]));
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">{NOMOGRAM_DISCLAIMER}</p>

      <CalcStepCard title="Дерево решений · номограммы">
        <ol className="text-muted-foreground mb-4 list-decimal space-y-1 pl-5 text-xs" aria-label="Путь решения">
          {treePath.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>

        <p className="mb-1 text-sm font-semibold text-[var(--clinical-foreground)]">{node.questionRu}</p>
        {node.helpRu ? <p className="text-muted-foreground mb-4 text-xs leading-relaxed">{node.helpRu}</p> : null}

        {step === "start_category" && node.options ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {node.options.map((opt) => (
              <Button
                key={opt.id}
                type="button"
                variant="outline"
                className="h-auto min-h-10 justify-start whitespace-normal py-2 text-left"
                onClick={() => {
                  if (opt.category) pickCategory(opt.category);
                  else if (opt.next === "trisomy_score") setStep("trisomy_score");
                }}
              >
                {opt.labelRu}
              </Button>
            ))}
          </div>
        ) : null}

        {step === "pick_nomogram" && category ? (
          <ul className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
            {nomogramsInCategory.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn(
                    "hover:bg-muted/80 w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    nomogram?.id === n.id ? "border-primary bg-muted" : "border-transparent",
                  )}
                  onClick={() => pickNomogram(n)}
                >
                  <span className="font-medium">{n.title}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {n.key} · {n.unit}
                    {n.source ? ` · ${n.source}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {(step === "enter_ga" || step === "enter_crl") && nomogram ? (
          <div className="space-y-3">
            <Badge variant="outline">{nomogram.title}</Badge>
            {step === "enter_ga" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="nomo-ga-w" className="text-sm font-medium">
                    Недели
                  </label>
                  <Input id="nomo-ga-w" inputMode="numeric" value={gaWeeks} onChange={(e) => setGaWeeks(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="nomo-ga-d" className="text-sm font-medium">
                    Дни
                  </label>
                  <Input id="nomo-ga-d" inputMode="numeric" value={gaDays} onChange={(e) => setGaDays(e.target.value)} />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="nomo-crl" className="text-sm font-medium">
                  КТР, мм
                </label>
                <Input id="nomo-crl" inputMode="decimal" value={crlMm} onChange={(e) => setCrlMm(e.target.value)} />
              </div>
            )}
            <Button type="button" onClick={() => setStep("enter_value")}>
              К вводу замера
            </Button>
          </div>
        ) : null}

        {step === "enter_value" && nomogram ? (
          <div className="space-y-3">
            <Badge variant="outline">{nomogram.title}</Badge>
            <div>
              <label htmlFor="nomo-val" className="text-sm font-medium">
                Значение, {nomogram.unit}
              </label>
              <Input id="nomo-val" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            {nomogramResult ? (
              <div
                className={cn(
                  "rounded-lg border p-4 text-sm",
                  nomogramResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5",
                )}
                role="status"
              >
                <p className="font-medium">{FLAG_LABELS[nomogramResult.flag] ?? nomogramResult.flag}</p>
                <p className="mt-2">{nomogramResult.summary}</p>
                {nomogramResult.interpolated?.p5 != null ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    {nomogramResult.percentileLabels?.low ?? "p5"} {nomogramResult.interpolated.p5} · p50{" "}
                    {nomogramResult.interpolated.p50} · {nomogramResult.percentileLabels?.high ?? "p95"}{" "}
                    {nomogramResult.interpolated.p95}
                  </p>
                ) : null}
                {nomogramResult.source ? (
                  <p className="text-muted-foreground mt-2 text-xs">Источник: {nomogramResult.source}</p>
                ) : null}
                {nomogramResult.warning === "OUT_OF_RANGE" ? (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Срок вне табличного диапазона — интерполяция на краю.</p>
                ) : null}
                {chartSeries && chartMarker ? (
                  <NomogramChart
                    className="mt-4"
                    series={chartSeries}
                    markerX={chartMarker.x}
                    markerY={chartMarker.y}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "trisomy_score" && trisomyResult ? (
          <div className="space-y-3">
            <ul className="space-y-2">
              {trisomyResult.items.map((item) => (
                <li key={item.sign}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={item.selected}
                      onChange={() => toggleTrisomy(item.sign)}
                    />
                    <span>
                      {item.sign} <span className="text-muted-foreground">(+{item.score})</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div
              className={cn(
                "rounded-lg border p-4 text-sm",
                trisomyResult.recommendKaryotyping
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-emerald-500/30 bg-emerald-500/5",
              )}
              role="status"
            >
              <p className="font-medium">
                Сумма: {trisomyResult.totalScore} (порог {trisomyResult.threshold})
              </p>
              <p className="mt-2">{trisomyResult.summary}</p>
              {trisomyResult.source ? (
                <p className="text-muted-foreground mt-2 text-xs">{trisomyResult.source}</p>
              ) : null}
            </div>
            {clinicalDefs.length ? (
              <details className="text-muted-foreground text-xs">
                <summary className="cursor-pointer font-medium text-[var(--clinical-foreground)]">
                  Клинические определения ({clinicalDefs.length})
                </summary>
                <ul className="mt-2 space-y-2 pl-4">
                  {clinicalDefs.map((d) => (
                    <li key={d.term}>
                      <span className="font-medium text-[var(--clinical-foreground)]">{d.term}:</span> {d.definition}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {step !== NOMOGRAM_WIZARD_START ? (
            <Button type="button" variant="outline" size="sm" onClick={resetWizard}>
              Сначала
            </Button>
          ) : null}
          {step === "enter_value" || step === "trisomy_score" ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setStep("start_category")}>
              Другая категория
            </Button>
          ) : null}
        </div>
      </CalcStepCard>
    </div>
  );
}
