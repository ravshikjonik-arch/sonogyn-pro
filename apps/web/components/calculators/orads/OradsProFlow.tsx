"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { OradsCategoryAtlas } from "@/components/calculators/orads/OradsCategoryAtlas";
import { OradsProCalculator } from "@/components/calculators/orads/OradsProCalculator";
import { Button } from "@/components/ui/button";
import {
  ORADS_ECHOGRAMS_LIBRARY_PATH,
  ORADS_US_CLINICAL_BULLETS,
  ORADS_US_PRIMARY_SOURCES,
} from "@repo/adnex-education";

import { ORADS_GOVERNING_BULLETS, ORADS_VERSION_LABEL } from "@/lib/orads-pro";

type SidePanel = "tables" | "resources" | null;

/** Режим приёма: сразу калькулятор, справка — по кнопке. */
export function OradsProFlow() {
  const [panel, setPanel] = useState<SidePanel>(null);

  const pushCrumb = useCallback((_label: string) => {
    /* упрощённый режим — без хлебных крошек */
  }, []);

  return (
    <div className="relative min-h-screen pb-36">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-[#0c4a6e] to-[#14b8a6] px-4 py-2.5 text-white lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/calculators">← Калькуляторы</Link>
          </Button>
          <span className="text-sm font-bold">O-RADS · режим приёма</span>
          <div className="ml-auto flex gap-1">
            <Button type="button" variant="secondary" size="sm" className="h-8 rounded-full text-xs" onClick={() => setPanel("tables")}>
              Таблицы
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-xs text-white hover:bg-white/20" onClick={() => setPanel("resources")}>
              Справка
            </Button>
          </div>
        </div>
      </div>

      <OradsProCalculator onCrumb={pushCrumb} />

      {panel ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 lg:items-center"
          role="dialog"
          aria-modal
        >
          <div className="clinical-surface max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--clinical-border)] px-4 py-3">
              <h2 className="font-black text-[var(--clinical-primary-deep)]">
                {panel === "tables" ? "Таблицы O-RADS 0–5" : "Справка"}
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
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    {ORADS_GOVERNING_BULLETS.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={ORADS_ECHOGRAMS_LIBRARY_PATH}>Эхограммы O-RADS →</Link>
                  </Button>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">
                    {ORADS_US_PRIMARY_SOURCES[0]}
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
                    {ORADS_US_CLINICAL_BULLETS.slice(0, 4).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">
                    Не является диагнозом. Интерпретация — лечащий специалист.
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
