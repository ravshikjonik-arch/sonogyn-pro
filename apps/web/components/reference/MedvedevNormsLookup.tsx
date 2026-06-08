"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Fragment } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  listBiometryAtWeek,
  MEDVEDEV_BIOMETRY_MAX_WEEK,
  MEDVEDEV_BIOMETRY_MIN_WEEK,
  MEDVEDEV_BIOMETRY_METRIC_OPTIONS,
  MEDVEDEV_BIOMETRY_SOURCE,
} from "@repo/medvedev-reference";
import {
  listAnatomyAtWeek,
  MEDVEDEV_ANATOMY_SOURCE,
} from "@repo/medvedev-reference";
import {
  listHeartOrbitsAtWeek,
  MEDVEDEV_HEART_ORBIT_METRIC_OPTIONS,
  MEDVEDEV_HEART_ORBITS_SOURCE,
} from "@repo/medvedev-reference";
import { getTeachForMarker } from "@repo/medvedev-reference";
import { listMcaPiAtWeek, listMcaPsvAtWeek, listDvPiAtWeek, listUaRiAtWeek, listPlacentaAfiAtWeek, MEDVEDEV_MCA_SOURCE, MEDVEDEV_MCA_PSV_SOURCE, MEDVEDEV_DV_LATE_SOURCE, MEDVEDEV_UA_RI_SOURCE, MEDVEDEV_AFI_SOURCE, MEDVEDEV_PLACENTA_SOURCE, MEDVEDEV_FINGER_SOURCE, MEDVEDEV_PLACENTA_AFI_OPTIONS } from "@repo/medvedev-reference";

const HEART_ORBIT_OPTIONS = MEDVEDEV_HEART_ORBIT_METRIC_OPTIONS.map((m) => ({
  id: m.id,
  label: m.label,
  unit: m.unit,
  group: m.group as "orbit" | "thymus" | "heart",
}));

const PLACENTA_AFI_OPTIONS = MEDVEDEV_PLACENTA_AFI_OPTIONS.map((m) => ({
  id: m.id,
  label: m.label,
  unit: m.unit,
  group: m.group as "afi" | "placenta" | "finger",
}));

const DOPPLER_OPTIONS = [
  { id: "mcaPi", label: "ПИ СМА", unit: "—", group: "doppler" as const },
  { id: "mcaPsv", label: "ПССК СМА", unit: "см/с", group: "doppler" as const },
  { id: "dvPi", label: "ПИ венозного протока (DV)", unit: "—", group: "doppler" as const },
  { id: "uaRi", label: "ИР артерии пуповины (UA RI)", unit: "—", group: "doppler" as const },
];

const ANATOMY_OPTIONS = [
  { id: "corpusCallosum", label: "ДМТ (мозолистое тело)", unit: "мм", group: "brain" as const },
  { id: "csp", label: "Ширина ППП", unit: "мм", group: "brain" as const },
  { id: "opticTract", label: "Зрительные тракты", unit: "мм", group: "brain" as const },
  { id: "cerebellumCr", label: "ККР мозжечка", unit: "мм", group: "brain" as const },
  { id: "cerebellumAp", label: "ПЗР мозжечка", unit: "мм", group: "brain" as const },
  { id: "sylvianDepth", label: "Сильвиева борозда", unit: "мм", group: "brain" as const },
  { id: "cerebellarAngle", label: "Угол ствол–мозжечок", unit: "°", group: "brain" as const },
  { id: "nasalBoneLength", label: "Длина кости носа", unit: "мм", group: "face" as const },
];

function formatBandValue(value: number, unit: string): string {
  return unit === "г" ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, "");
}

type NormMetricMeta = {
  id: string;
  label: string;
  unit: string;
  group: string;
};

function resolveNormMetricMeta(marker: string): NormMetricMeta | undefined {
  return (
    MEDVEDEV_BIOMETRY_METRIC_OPTIONS.find((m) => m.id === marker) ??
    ANATOMY_OPTIONS.find((m) => m.id === marker) ??
    HEART_ORBIT_OPTIONS.find((m) => m.id === marker) ??
    DOPPLER_OPTIONS.find((m) => m.id === marker) ??
    PLACENTA_AFI_OPTIONS.find((m) => m.id === marker)
  );
}

export function MedvedevNormsLookup() {
  const params = useSearchParams();
  const initialWeek = Number(params.get("week"));
  const initialQuery = params.get("q") ?? "";

  const [week, setWeek] = useState(
    Number.isFinite(initialWeek) && initialWeek >= MEDVEDEV_BIOMETRY_MIN_WEEK && initialWeek <= MEDVEDEV_BIOMETRY_MAX_WEEK
      ? initialWeek
      : 22,
  );
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<"all" | "second" | "third">("all");
  const [expandedMarker, setExpandedMarker] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
    if (Number.isFinite(initialWeek) && initialWeek >= 16 && initialWeek <= 40) setWeek(initialWeek);
  }, [initialQuery, initialWeek]);

  const rows = useMemo(() => {
    const mca = listMcaPiAtWeek(week);
    const mcaPsv = listMcaPsvAtWeek(week);
    const dv = listDvPiAtWeek(week);
    const ua = listUaRiAtWeek(week);
    const dopplerRows = [
      mca.reference
        ? {
            marker: "mcaPi" as const,
            label: mca.label,
            unit: "—",
            reference: mca.reference,
            flag: "unknown" as const,
            summary: "",
          }
        : null,
      mcaPsv.reference
        ? {
            marker: "mcaPsv" as const,
            label: `${mcaPsv.label} · Прил. 38`,
            unit: "см/с",
            reference: {
              p5: 0,
              p50: mcaPsv.reference.median,
              p95: mcaPsv.reference.mom15Threshold,
            },
            flag: "unknown" as const,
            summary: "",
          }
        : null,
      dv.reference
        ? {
            marker: "dvPi" as const,
            label: dv.source === "41" ? `${dv.label} · Прил. 41` : `${dv.label} · Прил. 40`,
            unit: "—",
            reference:
              dv.source === "40" && dv.reference && "min" in dv.reference
                ? {
                    p5: dv.reference.min,
                    p50: (dv.reference.meanLow + dv.reference.meanHigh) / 2,
                    p95: dv.reference.max,
                  }
                : (dv.reference as { p5: number; p50: number; p95: number }),
            flag: "unknown" as const,
            summary: "",
          }
        : null,
      ua.reference
        ? {
            marker: "uaRi" as const,
            label: `${ua.label} · Прил. 37`,
            unit: "—",
            reference: ua.reference,
            flag: "unknown" as const,
            summary: "",
          }
        : null,
    ].filter(Boolean) as Array<{
      marker: string;
      label: string;
      unit: string;
      reference: { p5: number; p50: number; p95: number };
      flag: "unknown";
      summary: string;
    }>;
    const placentaAfiRows = listPlacentaAfiAtWeek(week).map((row) => ({
      marker: row.marker,
      label: row.label,
      unit: row.unit,
      reference: row.reference,
      flag: "unknown" as const,
      summary: "",
    }));
    return [...listBiometryAtWeek(week), ...listAnatomyAtWeek(week), ...listHeartOrbitsAtWeek(week), ...dopplerRows, ...placentaAfiRows];
  }, [week]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const meta = resolveNormMetricMeta(row.marker);
      if (!meta) return false;
      if (filter === "second" && (week < 18 || week > 22)) return false;
      if (filter === "third" && (week < 30 || week > 34)) return false;
      if (!q) return true;
      return (
        meta.label.toLowerCase().includes(q) ||
        row.marker.toLowerCase().includes(q) ||
        meta.group.includes(q as "fetometry")
      );
    });
  }, [rows, query, filter, week]);

  const highlightSecond = week >= 18 && week <= 22;
  const highlightThird = week >= 30 && week <= 34;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <header className="border-b border-[var(--clinical-border)] bg-[var(--clinical-sidebar)] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Нормы по сроку · Медведев</h1>
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
              Прил. 1 — фетометрия и мозг II/III скрининга (p5 / p50 / p95)
            </p>
            <p className="mt-2 text-[10px]">
              <Link href="/reference" className="font-medium text-[var(--clinical-primary)] underline">
                ← Методики измерений
              </Link>
              {" · "}
              <Link href="/assistant/fmf" className="font-medium text-[var(--clinical-primary)] underline">
                FMF-ассистент →
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {highlightSecond ? (
              <span className="rounded-full bg-indigo-100 px-2 py-1 font-semibold text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100">
                II скрининг 18–22
              </span>
            ) : null}
            {highlightThird ? (
              <span className="rounded-full bg-violet-100 px-2 py-1 font-semibold text-violet-900 dark:bg-violet-950/50 dark:text-violet-100">
                III скрининг 30–34
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Неделя беременности
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min={MEDVEDEV_BIOMETRY_MIN_WEEK}
                max={MEDVEDEV_BIOMETRY_MAX_WEEK}
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full accent-[var(--clinical-primary)]"
              />
              <span className="w-12 shrink-0 text-center text-sm font-bold">{week}</span>
            </div>
          </div>
          <div className="relative">
            <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Поиск показателя
            </label>
            <Search className="absolute left-2 bottom-2.5 h-4 w-4 text-[var(--clinical-foreground-muted)]" />
            <Input
              className="mt-1 pl-8"
              placeholder="BPD, ОЖ, желудочки…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-end gap-1">
            {(
              [
                ["all", "Все"],
                ["second", "II скр."],
                ["third", "III скр."],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setFilter(id);
                  if (id === "second") setWeek(20);
                  if (id === "third") setWeek(32);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  filter === id
                    ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]"
                    : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto rounded-2xl border border-[var(--clinical-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--clinical-muted)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 font-semibold">Показатель</th>
                <th className="px-3 py-2 font-semibold">p5</th>
                <th className="px-3 py-2 font-semibold">p50</th>
                <th className="px-3 py-2 font-semibold">p95</th>
                <th className="px-3 py-2 font-semibold">Ед.</th>
                <th className="px-3 py-2 font-semibold">Учебник</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const meta = resolveNormMetricMeta(row.marker);
                if (!meta) return null;
                const ref = row.reference;
                const teach = getTeachForMarker(row.marker);
                const expanded = expandedMarker === row.marker;
                const isMcaPsv = row.marker === "mcaPsv";
                if (!ref) {
                  return (
                    <tr key={row.marker} className="border-t border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]">
                      <td className="px-3 py-2">{row.label}</td>
                      <td colSpan={5} className="px-3 py-2 text-xs">
                        Нет данных для {week} нед
                      </td>
                    </tr>
                  );
                }
                return (
                  <Fragment key={row.marker}>
                    <tr className="border-t border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]/50">
                      <td className="px-3 py-2">
                        <span className="font-medium">{meta.label}</span>
                      {meta.group === "brain" || meta.group === "face" ? (
                        <span className="ml-2 text-[10px] text-[var(--clinical-foreground-muted)]">
                          {meta.group === "brain" ? "мозг" : "лицо"}
                        </span>
                      ) : null}
                      {"group" in meta &&
                      ["orbit", "heart", "thymus", "doppler", "afi", "placenta", "finger"].includes(meta.group) ? (
                        <span className="ml-2 text-[10px] text-[var(--clinical-foreground-muted)]">
                          {meta.group === "orbit"
                            ? "орбиты"
                            : meta.group === "heart"
                              ? "сердце"
                              : meta.group === "thymus"
                                ? "тимус"
                                : meta.group === "doppler"
                                  ? "допплер"
                                  : meta.group === "afi"
                                    ? "воды"
                                    : meta.group === "placenta"
                                      ? "плацента"
                                      : "пальцы"}
                        </span>
                      ) : null}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{isMcaPsv ? "—" : formatBandValue(ref.p5, meta.unit)}</td>
                      <td className="px-3 py-2 tabular-nums font-semibold">
                        {formatBandValue(ref.p50, meta.unit)}
                        {isMcaPsv ? " (медиана)" : ""}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatBandValue(ref.p95, meta.unit)}
                        {isMcaPsv ? " (1,5 MoM)" : ""}
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--clinical-foreground-muted)]">{meta.unit}</td>
                      <td className="px-3 py-2">
                        {teach ? (
                          <button
                            type="button"
                            onClick={() => setExpandedMarker(expanded ? null : row.marker)}
                            className="text-[10px] font-semibold text-[var(--clinical-primary)] underline"
                          >
                            {expanded ? "Скрыть" : "Как мерить"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[var(--clinical-foreground-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                    {expanded && teach ? (
                      <tr className="border-t border-dashed border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
                        <td colSpan={6} className="px-3 py-3 text-xs">
                          <p className="font-bold text-amber-950 dark:text-amber-100">{teach.title}</p>
                          <p className="mt-1">
                            <span className="font-semibold">Как мерить: </span>
                            {teach.howToMeasure}
                          </p>
                          <p className="mt-1">
                            <span className="font-semibold">Клиника: </span>
                            {teach.clinicalMeaning}
                          </p>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--clinical-foreground-muted)]">Ничего не найдено. Измените неделю или запрос.</p>
        ) : null}

        <p className="mt-4 text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
          {MEDVEDEV_BIOMETRY_SOURCE}. {MEDVEDEV_ANATOMY_SOURCE}. {MEDVEDEV_HEART_ORBITS_SOURCE}. {MEDVEDEV_MCA_SOURCE}.{" "}
          {MEDVEDEV_MCA_PSV_SOURCE}. {MEDVEDEV_DV_LATE_SOURCE}. {MEDVEDEV_UA_RI_SOURCE}. {MEDVEDEV_AFI_SOURCE}. {MEDVEDEV_PLACENTA_SOURCE}. {MEDVEDEV_FINGER_SOURCE}. EFW — Hadlock IV. Не диагноз.
        </p>
      </div>
    </div>
  );
}

export type { MedvedevBiometryMarker } from "@repo/medvedev-reference";
