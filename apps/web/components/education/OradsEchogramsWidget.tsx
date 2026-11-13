"use client";

import Link from "next/link";
import { useState } from "react";

import { ORADS_US_MANAGEMENT, ORADS_US_VERSION, SUPPLEMENTARY_READING } from "@repo/adnex-education";

import { OradsNosologyPreview } from "@/components/calculators/orads/OradsNosologyPreview";
import { Button } from "@/components/ui/button";
import { ORADS_NOSOLOGY_ATLAS } from "@/lib/orads-pro/nosology-atlas";

export function OradsEchogramsWidget() {
  const [nosologyId, setNosologyId] = useState<string>(ORADS_NOSOLOGY_ATLAS[0]?.id ?? "");

  const supplementary = SUPPLEMENTARY_READING[0];
  const selectedNosology = ORADS_NOSOLOGY_ATLAS.find((n) => n.id === nosologyId) ?? ORADS_NOSOLOGY_ATLAS[0];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          O-RADS US · эхограммы
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">Эхограммы придатков матки из практики</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Официальный расчёт категории — по {ORADS_US_VERSION} (ACR) в{" "}
          <Link href="/tools/calc/rads/o-rads" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            калькуляторе O-RADS
          </Link>
          . Учебный алгоритм и клинические случаи — в{" "}
          <Link href="/tools/refs/orads-guide" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            руководстве O-RADS US
          </Link>
          . Здесь — обезличенные эхограммы из практики по типичным нозологиям и готовые формулировки для протокола.
        </p>
        {supplementary ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            {supplementary.citation} — {supplementary.note}
          </p>
        ) : null}
      </header>

      <section className="space-y-4 rounded-3xl border border-emerald-200/80 bg-[var(--clinical-card)] p-5 dark:border-emerald-900/40">
        <h2 className="text-lg font-bold">Нозологии O-RADS · эхограмма + протокол</h2>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Выберите образование — эхограмма и готовая формулировка для заключения. То же появляется в{" "}
          <Link href="/tools/calc/rads/o-rads" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            калькуляторе O-RADS
          </Link>{" "}
          при выборе типа кисты.
        </p>
        <div className="flex flex-wrap gap-2">
          {ORADS_NOSOLOGY_ATLAS.map((n) => (
            <Button
              key={n.id}
              type="button"
              size="sm"
              variant={nosologyId === n.id ? "default" : "outline"}
              aria-pressed={nosologyId === n.id}
              onClick={() => setNosologyId(n.id)}
            >
              {n.titleRu}
            </Button>
          ))}
        </div>
        {selectedNosology ? <OradsNosologyPreview entry={selectedNosology} /> : null}
      </section>

      <section className="rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
        <h2 className="text-lg font-bold">Тактика по O-RADS US (ACR v2022)</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3, 4, 5] as const).map((cat) => (
            <div
              key={cat}
              className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-surface)] p-3 text-xs"
            >
              <p className="font-bold text-[var(--clinical-primary-deep)]">O-RADS {cat}</p>
              <p className="mt-1 text-[var(--clinical-foreground-muted)]">{ORADS_US_MANAGEMENT[cat]}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Справочно: категорию и тактику определяет врач. Не диагноз — интерпретация специалиста.
      </p>
    </div>
  );
}
