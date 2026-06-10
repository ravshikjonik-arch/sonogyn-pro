"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ATLAS_SOURCE_CITATION,
  BLINOV_EARLY_THRESHOLDS,
  earlyPregnancyPrognosis,
  evaluateEarlyPregnancyRules,
  getAtlasDataset,
  listAtlasPages,
  searchAtlasPages,
  type AtlasPageRecord,
  type EarlyPregnancyCheckInput,
} from "@repo/obstetric-atlas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PART_LABELS: Record<string, string> = {
  all: "Все",
  early: "Ранняя 4–11 нед.",
  anatomy_11_14: "Топоанатомия 11–14",
  appendix: "Приложение",
  intro: "Введение",
  conclusion: "Заключение",
};

type Props = {
  initialPart?: string;
  initialPageId?: string;
};

export function ObstetricAtlasWidget({ initialPart = "all", initialPageId }: Props) {
  const catalog = getAtlasDataset().catalog;
  const [part, setPart] = useState(initialPart);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialPageId ?? null);

  const [checkInput, setCheckInput] = useState<EarlyPregnancyCheckInput>({
    gest_sac_ring_mm: undefined,
    yolk_sac_diameter_mm: undefined,
    yolk_sac_count: 1,
    embryo_count: 1,
    yolk_sac_echogenicity: "anechoic",
    yolk_sac_shape: "round",
  });

  const pages = useMemo(() => {
    const base =
      query.trim().length > 0
        ? searchAtlasPages(query)
        : listAtlasPages(part === "all" ? undefined : { part });
    return base;
  }, [part, query]);

  const selected: AtlasPageRecord | undefined = useMemo(() => {
    if (!selectedId) return pages[0];
    return pages.find((p) => p.id === selectedId) ?? pages[0];
  }, [pages, selectedId]);

  const ruleResults = evaluateEarlyPregnancyRules(checkInput);
  const prognosis = earlyPregnancyPrognosis(ruleResults);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Атлас I триместра
        </p>
        <h1 className="text-2xl font-bold text-[var(--clinical-foreground)] md:text-3xl">
          Эхограммы с комментариями
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Учебный слой по атласу Блинова/Емельяненко: эталонные срезы, ошибки плоскости и пороговые
          значения ранней беременности. Перцентили КТР/ТВП — в{" "}
          <Link href="/assistant/fmf" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            FMF-помощнике
          </Link>{" "}
          и{" "}
          <Link href="/reference" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            клинических нормах
          </Link>
          .
        </p>
        <p className="text-xs text-slate-500">{ATLAS_SOURCE_CITATION}</p>
      </header>

      <section className="rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 md:p-6">
        <h2 className="text-lg font-bold">Калькулятор ранней беременности (пороги атласа)</h2>
        <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
          Кольцо ПЯ ≥{BLINOV_EARLY_THRESHOLDS.gestSacRingMinMm} мм; ЖК{" "}
          {BLINOV_EARLY_THRESHOLDS.yolkSacMinMm}–{BLINOV_EARLY_THRESHOLDS.yolkSacMaxMm} мм; соотношение 1:1;
          анехогенный круглый ЖК.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="font-medium">Кольцо ПЯ, мм</span>
            <Input
              type="number"
              step="0.1"
              className="mt-1"
              value={checkInput.gest_sac_ring_mm ?? ""}
              onChange={(e) =>
                setCheckInput((s) => ({
                  ...s,
                  gest_sac_ring_mm: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Диаметр ЖК, мм</span>
            <Input
              type="number"
              step="0.1"
              className="mt-1"
              value={checkInput.yolk_sac_diameter_mm ?? ""}
              onChange={(e) =>
                setCheckInput((s) => ({
                  ...s,
                  yolk_sac_diameter_mm: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Число ЖК</span>
            <Input
              type="number"
              min={0}
              className="mt-1"
              value={checkInput.yolk_sac_count ?? ""}
              onChange={(e) =>
                setCheckInput((s) => ({ ...s, yolk_sac_count: Number(e.target.value) || 0 }))
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Число эмбрионов</span>
            <Input
              type="number"
              min={0}
              className="mt-1"
              value={checkInput.embryo_count ?? ""}
              onChange={(e) =>
                setCheckInput((s) => ({ ...s, embryo_count: Number(e.target.value) || 0 }))
              }
            />
          </label>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {ruleResults.map((r) => (
            <li
              key={r.id}
              className={r.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}
            >
              {r.message}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-semibold">
          Прогноз:{" "}
          {prognosis === "incomplete"
            ? "введите измерения"
            : prognosis === "normal"
              ? "соответствует норме по критериям атласа"
              : "признаки неблагоприятного прогноза по атласу"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Не заменяет клиническое решение. Интерпретация — лечащий специалист.
        </p>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", ...catalog.parts.map((p) => p.id)].map((id) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={part === id ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setPart(id)}
            >
              {PART_LABELS[id] ?? id}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Поиск по OCR-тексту, теме, сроку…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Данные атласа ещё импортируются. Запустите:{" "}
          <code className="rounded bg-slate-100 px-1">pnpm import:blinov-atlas</code>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-[var(--clinical-border)] p-2">
            {pages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  selected?.id === p.id
                    ? "bg-[var(--clinical-primary)]/15 font-semibold"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div>Стр. {p.book_page_label ?? p.page_number}</div>
                <div className="text-xs text-slate-500 line-clamp-2">
                  {p.section ?? p.title ?? p.topics.join(", ")}
                </div>
              </button>
            ))}
          </aside>

          {selected ? (
            <article className="space-y-4 rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>PDF стр. {selected.page_number}</span>
                {selected.book_page_label ? <span>книга стр. {selected.book_page_label}</span> : null}
                <span>{selected.part}</span>
                {selected.ga_weeks_min != null ? (
                  <span>
                    {selected.ga_weeks_min}–{selected.ga_weeks_max} нед.
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl font-bold">{selected.title ?? selected.section ?? "Эхограмма"}</h2>
              {selected.teaching_hint ? (
                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                  {selected.teaching_hint}
                </p>
              ) : null}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black/5 dark:border-slate-700">
                <Image
                  src={selected.image_href}
                  alt={selected.title ?? `Страница атласа ${selected.page_number}`}
                  width={1400}
                  height={900}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
              {selected.ocr_text ? (
                <details className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <summary className="cursor-pointer text-sm font-semibold">Текст страницы (OCR)</summary>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {selected.ocr_text}
                  </pre>
                </details>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
