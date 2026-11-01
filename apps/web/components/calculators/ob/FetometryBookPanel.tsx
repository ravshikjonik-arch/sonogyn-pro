"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

import {
  DOPPLER_FIELDS,
  EXTENDED_FIELDS,
  HEART_FIELDS,
  MEDVEDEV_BOOK_DISCLAIMER,
  MEDVEDEV_BOOK_SOURCE_VERSION,
  POPULATION_OPTIONS,
  T1_PANEL_FIELDS,
  T2_BASE_FIELDS,
  evaluateFetometryPanel,
  remapMeasurementIdsForPopulation,
  type FetometryPopulation,
  type FetometrySection,
  type MeasurementResult,
  type PanelField,
} from "@repo/fetal-nomograms";

type TabId = "t1" | "t2_base" | "extended" | "heart" | "doppler";

const TABS: { id: TabId; label: string }[] = [
  { id: "t1", label: "I триместр" },
  { id: "t2_base", label: "II–III база" },
  { id: "extended", label: "Расширенная" },
  { id: "heart", label: "Сердце / грудь" },
  { id: "doppler", label: "Допплер / плацента" },
];

const FIELDS: Record<TabId, PanelField[]> = {
  t1: T1_PANEL_FIELDS,
  t2_base: T2_BASE_FIELDS,
  extended: EXTENDED_FIELDS,
  heart: HEART_FIELDS,
  doppler: DOPPLER_FIELDS,
};

const ZONE_CLASS: Record<string, string> = {
  below: "border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100",
  above: "border-sky-400 bg-sky-50 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100",
  normal: "border-emerald-400 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100",
  mom_ok: "border-emerald-400 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100",
  mom_alert: "border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100",
  dating: "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]",
  out_of_range: "border-[var(--clinical-border)] bg-[var(--clinical-muted)]",
};

function ResultCard({ r }: { r: MeasurementResult }) {
  return (
    <div
      className={cn("rounded-xl border p-3 text-sm", ZONE_CLASS[r.zone] ?? ZONE_CLASS.out_of_range)}
      data-e2e-fetometry-result={r.id}
      data-zone={r.zone}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{r.titleRu}</p>
        <Badge variant="outline">{r.zoneLabelRu}</Badge>
      </div>
      <p className="mt-1 tabular-nums">
        Значение: <strong>{typeof r.value === "number" ? r.value : String(r.value)}</strong>
        {r.unit ? ` ${r.unit}` : ""}
      </p>
      {(r.pLow != null || r.p50 != null || r.pHigh != null || r.mom1_5 != null) && (
        <p className="mt-1 text-xs opacity-90">
          {r.mom1_5 != null
            ? `медиана ${r.median ?? "—"} · порог 1,5 MoM ${r.mom1_5}`
            : `норма ${r.pLow ?? "—"} – ${r.pHigh ?? "—"} (p50 ${r.p50 ?? "—"})`}
          {r.matchedLabel ? ` · строка ${r.matchedLabel}` : ""}
        </p>
      )}
      {r.nearestPercentileHint ? <p className="mt-1 text-xs opacity-80">{r.nearestPercentileHint}</p> : null}
    </div>
  );
}

export function FetometryBookPanel() {
  const [tab, setTab] = useState<TabId>("t1");
  const [gaWeeks, setGaWeeks] = useState("12");
  const [gaDays, setGaDays] = useState("0");
  const [crlMm, setCrlMm] = useState("55");
  const [bpdMm, setBpdMm] = useState("");
  const [population, setPopulation] = useState<FetometryPopulation>("moscow");
  const [values, setValues] = useState<Record<string, string>>({});

  const fields = FIELDS[tab];

  const panel = useMemo(() => {
    const weeks = Number(gaWeeks);
    const days = Number(gaDays);
    const crl = crlMm.trim() === "" ? undefined : Number(crlMm);
    const bpd = bpdMm.trim() === "" ? undefined : Number(bpdMm);
    if (!Number.isFinite(weeks)) return null;

    const measurements: Record<string, number | null> = {};
    for (const f of fields) {
      const raw = values[f.id];
      if (raw == null || raw.trim() === "") continue;
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n)) continue;
      measurements[f.id] = n;
    }
    if (!Object.keys(measurements).length) return null;

    const remapped =
      tab === "t2_base"
        ? remapMeasurementIdsForPopulation(measurements, population)
        : measurements;

    return evaluateFetometryPanel({
      ctx: {
        gaWeeks: weeks,
        gaDays: Number.isFinite(days) ? days : 0,
        crlMm: crl != null && Number.isFinite(crl) ? crl : undefined,
        bpdMm: bpd != null && Number.isFinite(bpd) ? bpd : undefined,
        population,
      },
      measurements: remapped,
      section: tab as FetometrySection,
      population,
    });
  }, [tab, gaWeeks, gaDays, crlMm, bpdMm, population, values, fields]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6" data-e2e-fetometry-book>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          Акушерство · фетометрия
        </p>
        <h1 className="text-2xl font-black text-[var(--clinical-foreground)]">Калькулятор фетометрии</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Таблицы Медведева (оцифровка {MEDVEDEV_BOOK_SOURCE_VERSION}). Срок → измерения → зона нормы.
        </p>
        <p className="text-sm">
          <Link className="text-[var(--clinical-primary)] underline" href="/tools/calc/ob/fetometry-norms">
            Номограммы / архив
          </Link>
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Разделы фетометрии">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-e2e-fetometry-tab={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-bold",
              tab === t.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                : "border-[var(--clinical-border)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <CalcStepCard title="Контекст">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <label className="text-sm">
            Срок, недели
            <Input
              inputMode="numeric"
              value={gaWeeks}
              onChange={(e) => setGaWeeks(e.target.value)}
              data-e2e-fetometry-ga-weeks
              className="mt-1"
            />
          </label>
          <label className="text-sm">
            Дни
            <Input
              inputMode="numeric"
              value={gaDays}
              onChange={(e) => setGaDays(e.target.value)}
              data-e2e-fetometry-ga-days
              className="mt-1"
            />
          </label>
          <label className="text-sm">
            КТР, мм
            <Input
              inputMode="decimal"
              value={crlMm}
              onChange={(e) => setCrlMm(e.target.value)}
              data-e2e-fetometry-crl
              className="mt-1"
            />
          </label>
          <label className="text-sm">
            БПР, мм
            <Input
              inputMode="decimal"
              value={bpdMm}
              onChange={(e) => setBpdMm(e.target.value)}
              data-e2e-fetometry-bpd-ctx
              className="mt-1"
              placeholder="для ШЗП по БПР"
            />
          </label>
        </div>
        {tab === "t2_base" ? (
          <label className="mt-3 block text-sm">
            Референсная популяция (базовая биометрия)
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-background)] px-3 text-sm"
              value={population}
              onChange={(e) => setPopulation(e.target.value as FetometryPopulation)}
              data-e2e-fetometry-population
            >
              {POPULATION_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.labelRu}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </CalcStepCard>

      <CalcStepCard title="Измерения">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <label key={f.id} className="text-sm">
              {f.labelRu}
              <span className="ml-1 text-xs text-[var(--clinical-foreground-muted)]">({f.unit})</span>
              <Input
                inputMode="decimal"
                value={values[f.id] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                data-e2e-fetometry-field={f.id}
                className="mt-1"
                placeholder={f.hintRu ?? ""}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setValues({})}
            aria-label="Очистить измерения"
          >
            Очистить поля
          </Button>
        </div>
      </CalcStepCard>

      <Card>
        <CardHeader>
          <CardTitle>Результат</CardTitle>
          <CardDescription>Сравнение с табличными процентилями без интерполяции</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3" aria-live="polite">
          {!panel ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">
              Укажите срок и хотя бы одно измерение.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-xs font-bold" data-e2e-fetometry-summary>
                <Badge variant="outline">ниже: {panel.summary.below}</Badge>
                <Badge variant="outline">норма: {panel.summary.normal}</Badge>
                <Badge variant="outline">выше: {panel.summary.above}</Badge>
                {panel.summary.momAlert > 0 ? (
                  <Badge variant="destructive">MoM alert: {panel.summary.momAlert}</Badge>
                ) : null}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {panel.results.map((r) => (
                  <ResultCard key={r.id} r={r} />
                ))}
              </div>
              <p className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-3 text-xs leading-relaxed">
                {MEDVEDEV_BOOK_DISCLAIMER}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
