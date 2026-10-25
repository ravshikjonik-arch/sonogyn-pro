"use client";

import Link from "next/link";
import { useState } from "react";

import { OradsAcrWizardExperience } from "@/components/calculators/orads/wizard/OradsAcrWizardExperience";
import { OradsCategoryAtlas } from "@/components/calculators/orads/OradsCategoryAtlas";
import { OradsCategoryGrid } from "@/components/calculators/orads/grids/OradsCategoryGrid";
import { OradsRussianCriteriaPanel } from "@/components/calculators/orads/OradsRussianCriteriaPanel";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { Button } from "@/components/ui/button";
import { SpatialModal } from "@/components/spatial";
import {
  ORADS_ECHOGRAMS_LIBRARY_PATH,
  ORADS_US_CLINICAL_BULLETS,
  ORADS_US_PRIMARY_SOURCES,
} from "@repo/adnex-education";

import {
  ORADS_GOVERNING_BULLETS,
  ORADS_LEXICON_DOTS,
  ORADS_MRI_ROWS,
  ORADS_VERSION_LABEL,
  type OradsMriRow,
} from "@/lib/orads-pro";

type SidePanel = "tables" | "resources" | "category-atlas" | null;

/** O-RADS US — ACR-style wizard + таблицы/справка. */
export function OradsProFlow() {
  const [panel, setPanel] = useState<SidePanel>(null);

  return (
    <div className="relative min-h-screen bg-[var(--clinical-canvas)]">
      <div className="absolute left-4 top-3 z-30 hidden sm:block">
        <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs shadow-sm">
          <Link href="/tools/calc">← Калькуляторы</Link>
        </Button>
      </div>

      <OradsAcrWizardExperience
        onOpenTables={() => setPanel("tables")}
        onOpenResources={() => setPanel("resources")}
      />

      <SpatialModal
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        title={
          panel === "tables"
            ? "Таблицы O-RADS 0–5"
            : panel === "category-atlas"
              ? "Учебная сетка категорий"
              : "Справка O-RADS US"
        }
        description={panel === "tables" ? "Критерии ACR O-RADS US v2022." : ORADS_VERSION_LABEL}
      >
        {panel === "tables" ? (
          <div className="space-y-6">
            <OradsRussianCriteriaPanel />
            <OradsCategoryAtlas />
            <section className="space-y-2">
              <h3 className="text-sm font-black text-[var(--clinical-foreground)]">Лексикон, до каждой точки</h3>
              <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-[var(--clinical-foreground)]">
                {ORADS_LEXICON_DOTS.map((dot: string) => (
                  <li key={dot}>{dot}</li>
                ))}
              </ul>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-black text-[var(--clinical-foreground)]">O-RADS MRI</h3>
              <p className="text-xs text-[var(--clinical-foreground-muted)]">
                Шкала ACR. PPV ориентировочные, для категории целиком, включая пограничные опухоли. Это справочник, не автоматический калькулятор.
              </p>
              <div className="space-y-2">
                {ORADS_MRI_ROWS.map((row: OradsMriRow) => (
                  <article key={row.score} className="rounded-xl border border-[var(--clinical-border)] p-3">
                    <p className="text-sm font-black">
                      MRI {row.score} · {row.risk} · PPV {row.ppv}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs leading-relaxed">
                      {row.points.map((point: string) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
            <Button type="button" variant="outline" size="sm" onClick={() => setPanel("category-atlas")}>
              Учебная сетка категорий
            </Button>
          </div>
        ) : panel === "category-atlas" ? (
          <OradsCategoryGrid />
        ) : (
          <div className="space-y-4 text-sm">
            <p className="font-bold">{ORADS_VERSION_LABEL}</p>
            <ul className="list-inside list-disc space-y-1 text-xs">
              {ORADS_GOVERNING_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{ORADS_US_PRIMARY_SOURCES[0]}</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
              {ORADS_US_CLINICAL_BULLETS.slice(0, 4).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Button type="button" variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href={ORADS_ECHOGRAMS_LIBRARY_PATH}>Эхограммы O-RADS</Link>
            </Button>
            <Button type="button" variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href="/tools/refs/orads-guide">Руководство v2022</Link>
            </Button>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Не является диагнозом. Интерпретация — лечащий специалист.
            </p>
            <CalculatorLiteraturePanel slug="o-rads" compact />
          </div>
        )}
      </SpatialModal>
    </div>
  );
}
