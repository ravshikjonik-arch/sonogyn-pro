"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { OradsCategoryAtlas } from "@/components/calculators/orads/OradsCategoryAtlas";
import { OradsOvaryHero } from "@/components/calculators/orads/OradsOvaryHero";
import { OradsProCalculator } from "@/components/calculators/orads/OradsProCalculator";
import { Button } from "@/components/ui/button";
import {
  ORADS_ECHOGRAMS_LIBRARY_PATH,
  ORADS_US_CLINICAL_BULLETS,
  ORADS_US_PRIMARY_SOURCES,
  SUPPLEMENTARY_READING,
} from "@repo/adnex-education";

import { ORADS_GOVERNING_BULLETS, ORADS_VERSION_LABEL } from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

type Phase = "splash" | "calc";
type SidePanel = "tables" | "resources" | null;

export function OradsProFlow() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [panel, setPanel] = useState<SidePanel>(null);
  const [crumb, setCrumb] = useState<string[]>([]);

  const pushCrumb = useCallback((label: string) => {
    setCrumb((prev) => (prev.includes(label) ? prev : [...prev, label]));
  }, []);

  if (phase === "splash") {
    return (
      <div className="px-4 py-6 lg:px-10">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/calculators">← Каталог</Link>
        </Button>
        <OradsOvaryHero onContinue={() => setPhase("calc")} />
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={ORADS_ECHOGRAMS_LIBRARY_PATH}>Эхограммы и случаи O-RADS →</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/ovary-atlas">Макет яичника · фолликулы и ИИ по снимку →</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-28">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-[#0c4a6e] via-[#0e7490] to-[#14b8a6] px-4 py-3 text-white lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => {
              setPhase("splash");
              setCrumb([]);
            }}
            aria-label="На заставку"
          >
            ←
          </Button>
          <nav className="flex flex-wrap items-center gap-1 text-xs font-semibold">
            <button type="button" className="underline-offset-2 hover:underline" onClick={() => setCrumb([])}>
              O-RADS US
            </button>
            {crumb.map((c) => (
              <span key={c} className="flex items-center gap-1">
                <span className="opacity-60">›</span>
                <span>{c}</span>
              </span>
            ))}
          </nav>
        </div>
      </div>

      <OradsProCalculator onCrumb={pushCrumb} />

      <div
        className={cn(
          "fixed inset-x-0 z-40 flex gap-2 border-t border-[var(--clinical-border)] bg-[var(--clinical-header)]/95 p-3 shadow-lg backdrop-blur lg:left-64",
          "bottom-[7.5rem] xl:bottom-[7.5rem]",
        )}
      >
        <div className="mx-auto flex w-full max-w-3xl gap-2">
          <Button
            type="button"
            className="flex-1 rounded-full bg-[var(--clinical-primary)] font-bold text-white hover:bg-[var(--clinical-primary-hover)]"
            onClick={() => setPanel("tables")}
          >
            Таблицы O-RADS 0–5
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1 rounded-full font-bold"
            onClick={() => setPanel("resources")}
          >
            Справка
          </Button>
        </div>
      </div>

      {panel ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 lg:items-center"
          role="dialog"
          aria-modal
        >
          <div className="clinical-surface max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--clinical-border)] px-4 py-3">
              <h2 className="font-black text-[var(--clinical-primary-deep)]">
                {panel === "tables" ? "Таблицы · разбор случаев" : "Справка · O-RADS US"}
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
                Закрыть
              </Button>
            </div>
            <div className="overflow-y-auto p-4">
              {panel === "tables" ? (
                <OradsCategoryAtlas />
              ) : (
                <div className="space-y-5 text-sm">
                  <section>
                    <p className="font-bold">{ORADS_VERSION_LABEL}</p>
                    <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
                      Международный протокол стратификации риска аднексальных образований.
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-2 text-xs leading-relaxed">
                      {ORADS_GOVERNING_BULLETS.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <p className="font-bold">Источники</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                      {ORADS_US_PRIMARY_SOURCES.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <p className="font-bold">Клинические уточнения O-RADS US / IOTA</p>
                    <ul className="mt-2 list-inside list-disc space-y-2 text-xs leading-relaxed">
                      {ORADS_US_CLINICAL_BULLETS.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-700 dark:text-slate-200">Дополнительная литература</p>
                    <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
                      Для углубления и разбора эхограмм — не заменяет ACR O-RADS US.
                    </p>
                    <ul className="mt-3 space-y-3 text-xs">
                      {SUPPLEMENTARY_READING.map((r) => (
                        <li key={r.id}>
                          <p className="font-medium text-[var(--clinical-foreground)]">{r.citation}</p>
                          <p className="mt-0.5 text-[var(--clinical-foreground-muted)]">{r.note}</p>
                          {r.href ? (
                            <Button variant="outline" size="sm" asChild className="mt-2">
                              <Link href={r.href}>Открыть с эхограммами →</Link>
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <p className="text-xs text-[var(--clinical-foreground-muted)]">
                    IOTA ADNEX / консенсус 2026 — в шаге 7 калькулятора. Не является диагнозом.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
