"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const selectClassName =
  "mt-1 flex h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-background)] px-3 py-2 text-sm";

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--clinical-foreground)]">
      {children}
    </label>
  );
}
import {
  ARCHIVE_CALCULATOR_DISCLAIMER,
  evaluateArchiveNorm,
  getArchiveTableDocument,
  listArchiveCalculatorCards,
  listArchiveTableParameters,
  medvedevArchiveBookStats,
  type ArchiveCalculatorCard,
} from "@repo/medvedev-reference";

const BLOCK_LABELS: Record<string, string> = {
  early_dating: "Малый срок",
  screening_i: "I скрининг",
  fetometry: "Фетометрия II/III",
  doppler_late: "Допплер",
  anatomy_other: "Анатомия и прочее",
};

const FLAG_LABELS: Record<string, string> = {
  low: "Ниже нормы (≤5%)",
  normal: "В пределах табличной нормы",
  high: "Выше нормы (≥95%)",
  out_of_range: "Вне диапазона таблицы",
  unsupported: "Тип таблицы пока не поддержан",
  unknown: "Недостаточно данных",
};

function needsGa(tableType: string): boolean {
  return (
    tableType === "percentile_by_ga" ||
    tableType === "percentile_partial" ||
    tableType === "mean_range_by_ga" ||
    tableType.startsWith("percentile_by_ga") ||
    tableType === "percentile_by_bpd" ||
    tableType === "p50_only_by_ga"
  );
}

function needsCrl(tableType: string): boolean {
  return tableType === "percentile_by_crl";
}

function needsAxis(tableType: string): boolean {
  return tableType === "percentile_by_measurement";
}

function isDating(tableType: string): boolean {
  return tableType === "dating_inverse";
}

type Props = {
  initialTableId?: string;
};

export function FetometryNormsCalculatorHub({ initialTableId }: Props) {
  const bookStats = useMemo(() => medvedevArchiveBookStats(), []);
  const cards = useMemo(() => listArchiveCalculatorCards(), []);
  const [query, setQuery] = useState("");
  const [block, setBlock] = useState<string>("all");
  const [selectedId, setSelectedId] = useState(initialTableId ?? cards[0]?.tableId ?? "2.17");

  const selected = cards.find((c) => c.tableId === selectedId) ?? cards[0];
  const [subTableId, setSubTableId] = useState<string | undefined>(selected?.multiTable?.[0]);

  const doc = selected ? getArchiveTableDocument(selected.tableId, subTableId) : null;
  const tableType = doc?.tableType ?? selected?.tableType ?? "percentile_by_ga";

  const parameters = selected ? listArchiveTableParameters(selected.tableId, subTableId) : [];
  const [parameterId, setParameterId] = useState<string | undefined>(parameters[0]?.id);

  const [gaWeeks, setGaWeeks] = useState("20");
  const [gaDays, setGaDays] = useState("0");
  const [crlMm, setCrlMm] = useState("");
  const [axisValue, setAxisValue] = useState("");
  const [value, setValue] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (block !== "all" && c.clinicalBlock !== block) return false;
      if (!q) return true;
      return (
        c.titleRu.toLowerCase().includes(q) ||
        c.tableId.includes(q) ||
        (c.source?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cards, query, block]);

  const result = useMemo(() => {
    if (!selected) return null;
    const w = Number.parseInt(gaWeeks, 10);
    const d = Number.parseInt(gaDays, 10);
    const v = Number.parseFloat(value.replace(",", "."));
    const crl = crlMm.trim() ? Number.parseFloat(crlMm.replace(",", ".")) : undefined;
    const axis = axisValue.trim() ? Number.parseFloat(axisValue.replace(",", ".")) : undefined;

    return evaluateArchiveNorm({
      tableId: selected.tableId,
      subTableId,
      parameterId,
      gaWeeks: Number.isFinite(w) ? w : undefined,
      gaDays: Number.isFinite(d) ? d : undefined,
      value: Number.isFinite(v) ? v : undefined,
      crlMm: crl,
      axisValue: axis,
    });
  }, [selected, subTableId, parameterId, gaWeeks, gaDays, value, crlMm, axisValue]);

  function pickCard(c: ArchiveCalculatorCard) {
    setSelectedId(c.tableId);
    setSubTableId(c.multiTable?.[0]);
    const params = listArchiveTableParameters(c.tableId, c.multiTable?.[0]);
    setParameterId(params[0]?.id);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">Акушерство · табличные нормы</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Калькулятор фетометрии (нормы)</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          {bookStats.totalCards} таблиц из «{bookStats.sourceBook}»: JSON для расчёта и скан страницы для
          сверки с книгой. Перцентили и атрибуция источника в результате.
        </p>
        <p className="text-muted-foreground text-xs">{ARCHIVE_CALCULATOR_DISCLAIMER}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Каталог таблиц</CardTitle>
            <CardDescription>
              {cards.length} карточек · {bookStats.byStatus.extracted ?? 0} полных ·{" "}
              {bookStats.byStatus.partial ?? 0} с усечённым диапазоном сроков
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Поиск: сильвиева, аорта, ЧСС…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск таблицы"
            />
            <select
              className={selectClassName}
              aria-label="Блок"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
            >
              <option value="all">Все блоки</option>
              {Object.entries(BLOCK_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <ul className="max-h-[420px] space-y-1 overflow-y-auto pr-1" role="listbox" aria-label="Таблицы">
              {filtered.map((c) => (
                <li key={c.tableId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.tableId === selectedId}
                    className={cn(
                      "hover:bg-muted/80 w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      c.tableId === selectedId ? "border-primary bg-muted" : "border-transparent",
                    )}
                    onClick={() => pickCard(c)}
                  >
                    <span className="font-medium">{c.titleRu}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      Табл. {c.tableId} · {BLOCK_LABELS[c.clinicalBlock] ?? c.clinicalBlock}
                      {c.partial ? " · уточняется" : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <CalcStepCard title={`Таблица ${selected.tableId}`}>
              <div className="mb-4 flex flex-wrap gap-2">
                {selected.verified ? (
                  <Badge variant="secondary">Сверено</Badge>
                ) : (
                  <Badge variant="outline">Не сверено</Badge>
                )}
                {selected.partial ? (
                  <Badge variant="outline">Диапазон сроков на скане неполный</Badge>
                ) : null}
                {selected.cardIndex != null ? (
                  <Badge variant="outline">Карточка {selected.cardIndex}/96</Badge>
                ) : null}
                {doc?.source ? <Badge variant="outline">{doc.source}</Badge> : null}
              </div>
              <p className="text-muted-foreground mb-4 text-sm">{selected.titleRu}</p>

              {selected.imageSrc ? (
                <figure className="mb-4 overflow-hidden rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-background)]">
                  <Image
                    src={selected.imageSrc}
                    alt={`Скан таблицы ${selected.tableId}: ${selected.titleRu}`}
                    width={960}
                    height={720}
                    className="h-auto max-h-[min(420px,50vh)] w-full object-contain"
                    sizes="(max-width: 1024px) 100vw, 540px"
                    unoptimized
                  />
                  <figcaption className="text-muted-foreground border-t px-3 py-2 text-xs">
                    Учебный скан · табл. {selected.tableId}. Сверьте цифры с монитором и протоколом.
                  </figcaption>
                </figure>
              ) : null}

              {selected.partialNote || doc?.partialNote ? (
                <p className="text-muted-foreground mb-4 text-xs">{selected.partialNote ?? doc?.partialNote}</p>
              ) : null}

              {selected.multiTable?.length ? (
                <div className="mb-4 space-y-1">
                  <FieldLabel htmlFor="sub-table">Подтаблица</FieldLabel>
                  <select
                    id="sub-table"
                    className={selectClassName}
                    value={subTableId ?? selected.multiTable[0]}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSubTableId(v);
                      const params = listArchiveTableParameters(selected.tableId, v);
                      setParameterId(params[0]?.id);
                    }}
                  >
                    {selected.multiTable.map((id) => (
                      <option key={id} value={id}>
                        Таблица {id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {parameters.length > 1 ? (
                <div className="mb-4 space-y-1">
                  <FieldLabel htmlFor="param">Параметр</FieldLabel>
                  <select
                    id="param"
                    className={selectClassName}
                    value={parameterId ?? parameters[0]?.id}
                    onChange={(e) => setParameterId(e.target.value)}
                  >
                    {parameters.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.labelRu}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {needsGa(tableType) ? (
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="ga-weeks">Срок, нед</FieldLabel>
                    <Input
                      id="ga-weeks"
                      inputMode="numeric"
                      value={gaWeeks}
                      onChange={(e) => setGaWeeks(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel htmlFor="ga-days">Дни</FieldLabel>
                    <Input
                      id="ga-days"
                      inputMode="numeric"
                      value={gaDays}
                      onChange={(e) => setGaDays(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {needsCrl(tableType) ? (
                <div className="mb-4 space-y-1">
                  <FieldLabel htmlFor="crl">КТР, мм</FieldLabel>
                  <Input id="crl" inputMode="decimal" value={crlMm} onChange={(e) => setCrlMm(e.target.value)} />
                </div>
              ) : null}

              {needsAxis(tableType) ? (
                <div className="mb-4 space-y-1">
                  <FieldLabel htmlFor="axis">{doc?.xAxis?.labelRu ?? "Ось X"}, мм</FieldLabel>
                  <Input
                    id="axis"
                    inputMode="decimal"
                    value={axisValue}
                    onChange={(e) => setAxisValue(e.target.value)}
                  />
                </div>
              ) : null}

              <div className="mb-4 space-y-1">
                <FieldLabel htmlFor="measure">
                  {isDating(tableType)
                    ? (doc?.parameter?.labelRu ?? "Измерение")
                    : (parameters.find((p) => p.id === parameterId)?.labelRu ?? "Измерение")}
                  {doc?.parameter?.unit || parameters[0]?.unit ? `, ${doc?.parameter?.unit ?? parameters[0]?.unit}` : ""}
                </FieldLabel>
                <Input id="measure" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>

              {result ? (
                <div
                  className={cn(
                    "rounded-lg border p-4 text-sm",
                    result.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5",
                  )}
                  role="status"
                >
                  <p className="font-medium">{FLAG_LABELS[result.flag] ?? result.flag}</p>
                  <p className="mt-2">{result.summary}</p>
                  {result.percentile != null ? (
                    <p className="text-muted-foreground mt-1 text-xs">Оценка перцентиля: ~{result.percentile}</p>
                  ) : null}
                  {result.reference ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Референс: {result.reference.lowLabel ?? "p5"} {result.reference.p5.toFixed(2)} · p50{" "}
                      {result.reference.p50.toFixed(2)} · {result.reference.highLabel ?? "p95"}{" "}
                      {result.reference.p95.toFixed(2)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CalcStepCard>
          ) : null}

          <div className="flex flex-wrap gap-2 text-sm">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/calc/ob">Калькуляторы срока Б</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ai/consultants/fmf">FMF · I скрининг</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/obstetrics">Хаб акушерства</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
