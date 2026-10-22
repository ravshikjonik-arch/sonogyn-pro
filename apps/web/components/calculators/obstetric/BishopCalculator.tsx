"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CalculatorFavoriteButton } from "@/components/calculators/CalculatorFavoriteButton";
import { CalculatorReportPanel } from "@/components/calculators/CalculatorReportPanel";
import { CalculatorSourcesPanel } from "@/components/calculators/CalculatorSourcesPanel";
import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { parseShareInt, readShareParamsFromUrl } from "@/lib/calculators/apply-url-params";
import { useCalculatorWorkspace } from "@/lib/hooks/use-calculator-workspace";
import { buildCalculatorGeneratedReport } from "@/lib/reports/calculator-report-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BISHOP_DISCLAIMER,
  bishopScore,
  type BishopConsistency,
  type BishopDilation,
  type BishopEffacement,
  type BishopPosition,
  type BishopStation,
} from "@repo/medical-calculations";

const DILATION_OPTS: { v: BishopDilation; l: string }[] = [
  { v: 0, l: "0 см" },
  { v: 1, l: "1–2 см" },
  { v: 2, l: "3–4 см" },
  { v: 3, l: "≥5 см" },
];
const EFF_OPTS: { v: BishopEffacement; l: string }[] = [
  { v: 0, l: "0–30%" },
  { v: 1, l: "40–50%" },
  { v: 2, l: "60–70%" },
  { v: 3, l: "≥80%" },
];
const ST_OPTS: { v: BishopStation; l: string }[] = [
  { v: 0, l: "−3" },
  { v: 1, l: "−2" },
  { v: 2, l: "−1/0" },
  { v: 3, l: "+1/+2" },
];
const CON_OPTS: { v: BishopConsistency; l: string }[] = [
  { v: 0, l: "Плотная" },
  { v: 1, l: "Средняя" },
  { v: 2, l: "Мягкая" },
];
const POS_OPTS: { v: BishopPosition; l: string }[] = [
  { v: 0, l: "Задняя" },
  { v: 1, l: "Средняя" },
  { v: 2, l: "Передняя" },
];

const CALC_ID = "bishop";
const SHARE_PATH = "/tools/calc/ob/bishop";

export function BishopCalculator() {
  const [dilation, setDilation] = useState<BishopDilation>(0);
  const [effacement, setEffacement] = useState<BishopEffacement>(0);
  const [station, setStation] = useState<BishopStation>(0);
  const [consistency, setConsistency] = useState<BishopConsistency>(1);
  const [position, setPosition] = useState<BishopPosition>(1);
  const { recordRun } = useCalculatorWorkspace(CALC_ID);

  useEffect(() => {
    const p = readShareParamsFromUrl();
    if (!p) return;
    const d = parseShareInt(p.dilation);
    const e = parseShareInt(p.effacement);
    const s = parseShareInt(p.station);
    const c = parseShareInt(p.consistency);
    const pos = parseShareInt(p.position);
    if (d != null && d >= 0 && d <= 3) setDilation(d as BishopDilation);
    if (e != null && e >= 0 && e <= 3) setEffacement(e as BishopEffacement);
    if (s != null && s >= 0 && s <= 3) setStation(s as BishopStation);
    if (c != null && c >= 0 && c <= 2) setConsistency(c as BishopConsistency);
    if (pos != null && pos >= 0 && pos <= 2) setPosition(pos as BishopPosition);
  }, []);

  const result = useMemo(
    () => bishopScore({ dilation, effacement, station, consistency, position }),
    [dilation, effacement, station, consistency, position],
  );

  const shareParams = useMemo(
    () => ({ dilation, effacement, station, consistency, position }),
    [dilation, effacement, station, consistency, position],
  );

  const generatedReport = useMemo(
    () =>
      buildCalculatorGeneratedReport(
        CALC_ID,
        shareParams as Record<string, unknown>,
        result as unknown as Record<string, unknown>,
        result.total,
      ),
    [result, shareParams],
  );
  const reportText = generatedReport?.plainText ?? "";

  useEffect(() => {
    recordRun({
      path: SHARE_PATH,
      title: "Шкала Bishop",
      summary: `${result.total}/13 · ${result.interpretation}`,
      params: shareParams,
    });
  }, [recordRun, result.interpretation, result.total, shareParams]);

  const onSaveToHistory = useCallback(() => {
    recordRun({
      path: SHARE_PATH,
      title: "Шкала Bishop",
      summary: `${result.total}/13 · ${result.interpretation}`,
      params: shareParams,
    });
    toast.success("Добавлено в локальную историю");
  }, [recordRun, result.interpretation, result.total, shareParams]);

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/tools/calc/appointment">← Для приёма</Link>
      </Button>
      <header className="mx-auto flex max-w-3xl flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Badge variant="outline">Индукция · созревание шейки</Badge>
          <h1 className="text-3xl font-black tracking-tight">Шкала Бишопа</h1>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Modified Bishop 0–13 · ≥6 благоприятна для индукции</p>
        </div>
        <CalculatorFavoriteButton calculatorId={CALC_ID} />
      </header>
      <div className="mx-auto max-w-3xl space-y-4">
        <CalcStepCard title="Раскрытие" required>
          <div className="flex flex-wrap gap-2">
            {DILATION_OPTS.map((o) => (
              <CalcChip key={o.v} label={o.l} selected={dilation === o.v} onClick={() => setDilation(o.v)} />
            ))}
          </div>
        </CalcStepCard>
        <CalcStepCard title="Сглаженность">
          <div className="flex flex-wrap gap-2">
            {EFF_OPTS.map((o) => (
              <CalcChip key={o.v} label={o.l} selected={effacement === o.v} onClick={() => setEffacement(o.v)} />
            ))}
          </div>
        </CalcStepCard>
        <CalcStepCard title="Сведение головки (station)">
          <div className="flex flex-wrap gap-2">
            {ST_OPTS.map((o) => (
              <CalcChip key={o.v} label={o.l} selected={station === o.v} onClick={() => setStation(o.v)} />
            ))}
          </div>
        </CalcStepCard>
        <CalcStepCard title="Консистенция">
          <div className="flex flex-wrap gap-2">
            {CON_OPTS.map((o) => (
              <CalcChip key={o.v} label={o.l} selected={consistency === o.v} onClick={() => setConsistency(o.v)} />
            ))}
          </div>
        </CalcStepCard>
        <CalcStepCard title="Положение шейки">
          <div className="flex flex-wrap gap-2">
            {POS_OPTS.map((o) => (
              <CalcChip key={o.v} label={o.l} selected={position === o.v} onClick={() => setPosition(o.v)} />
            ))}
          </div>
        </CalcStepCard>
        <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-5">
          <p className="text-3xl font-black text-[var(--clinical-primary-deep)]">{result.total} / 13</p>
          <p className="mt-2 text-sm font-semibold">{result.interpretation}</p>
          <ul className="mt-3 space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
            {result.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
        <CalculatorReportPanel
          title="Шкала Bishop — черновик"
          reportText={reportText}
          filenameBase="bishop-score"
          sharePath={SHARE_PATH}
          shareParams={shareParams}
          repeatHref={SHARE_PATH}
          onSaveToHistory={onSaveToHistory}
        />
        <CalculatorSourcesPanel calculatorId={CALC_ID} />
        <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{BISHOP_DISCLAIMER}</p>
      </div>
    </div>
  );
}
