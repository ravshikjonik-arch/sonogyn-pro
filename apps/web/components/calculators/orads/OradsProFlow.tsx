"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { OradsCategoryAtlas } from "@/components/calculators/orads/OradsCategoryAtlas";
import { OradsOvaryHero } from "@/components/calculators/orads/OradsOvaryHero";
import { OradsProCalculator } from "@/components/calculators/orads/OradsProCalculator";
import { Button } from "@/components/ui/button";
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
        <div className="mx-auto mt-4 flex max-w-3xl justify-center">
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
                {panel === "tables" ? "Таблицы · разбор случаев" : "Ресурсы · O-RADS US"}
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
                Закрыть
              </Button>
            </div>
            <div className="overflow-y-auto p-4">
              {panel === "tables" ? (
                <OradsCategoryAtlas />
              ) : (
                <div className="space-y-4 text-sm">
                  <p className="font-bold">{ORADS_VERSION_LABEL}</p>
                  <ul className="list-inside list-disc space-y-2 text-xs leading-relaxed">
                    {ORADS_GOVERNING_BULLETS.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">
                    IOTA ADNEX / консенсус 2026 — в шаге 7 калькулятора, когда заполнены признаки образования.
                    Не является диагнозом.
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
