"use client";

import Link from "next/link";
import { useState } from "react";

import { OradsUnifiedCalculator } from "@/components/calculators/orads/OradsUnifiedCalculator";
import { OradsCategoryAtlas } from "@/components/calculators/orads/OradsCategoryAtlas";
import { OradsCategoryGrid } from "@/components/calculators/orads/grids/OradsCategoryGrid";
import { OradsRussianCriteriaPanel } from "@/components/calculators/orads/OradsRussianCriteriaPanel";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpatialModal } from "@/components/spatial";
import {
  ORADS_ECHOGRAMS_LIBRARY_PATH,
  ORADS_US_CLINICAL_BULLETS,
  ORADS_US_PRIMARY_SOURCES,
} from "@repo/adnex-education";

import { ORADS_GOVERNING_BULLETS, ORADS_VERSION_LABEL } from "@/lib/orads-pro";

type SidePanel = "tables" | "resources" | "category-atlas" | null;

/** Единая точка O-RADS US на платформе (калькулятор + справка). */
export function OradsProFlow() {
  const [panel, setPanel] = useState<SidePanel>(null);

  return (
    <div className="relative min-h-screen pb-36">
      <div className="clinical-calc-toolbar px-4 py-2.5 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/app">Рабочий кабинет</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/tools/calc">Калькуляторы</Link>
          </Button>
          <span className="text-sm font-bold">O-RADS US · единый калькулятор</span>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full text-xs text-white hover:bg-white/20"
                  aria-label="Справка O-RADS"
                >
                  Справка
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem onSelect={() => setPanel("tables")}>Таблицы 0–5</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPanel("category-atlas")}>Сетка категорий (учебная)</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPanel("resources")}>Источники ACR</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={ORADS_ECHOGRAMS_LIBRARY_PATH}>Эхограммы O-RADS</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tools/refs/orads-guide">Руководство v2022</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tools/calc/rads/iota">Калькулятор IOTA</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <OradsUnifiedCalculator />

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
              : "Справка"
        }
        description={panel === "tables" ? "Критерии ACR O-RADS US v2022." : ORADS_VERSION_LABEL}
      >
        {panel === "tables" ? (
          <div className="space-y-6">
            <OradsRussianCriteriaPanel />
            <OradsCategoryAtlas />
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
