"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { OradsCategoryAtlas } from "@/components/calculators/orads/OradsCategoryAtlas";
import { OradsDualGrid } from "@/components/calculators/orads/grids/OradsDualGrid";
import { OradsProCalculator } from "@/components/calculators/orads/OradsProCalculator";
import { OradsRussianCriteriaPanel } from "@/components/calculators/orads/OradsRussianCriteriaPanel";
import { OradsTextCalculator } from "@/components/calculators/orads/OradsTextCalculator";
import { OradsUsWizard } from "@/components/calculators/orads/wizard/OradsUsWizard";
import { IotaSimpleRulesPanel } from "@/components/calculators/orads/IotaSimpleRulesPanel";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { ClinicalWorkspace, FloatingInsight, SpatialModal } from "@/components/spatial";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import {
  ORADS_ECHOGRAMS_LIBRARY_PATH,
  ORADS_US_CLINICAL_BULLETS,
  ORADS_US_PRIMARY_SOURCES,
} from "@repo/adnex-education";

import { ORADS_GOVERNING_BULLETS, ORADS_VERSION_LABEL } from "@/lib/orads-pro";

type SidePanel = "tables" | "resources" | null;
type OradsMode = "grids" | "wizard" | "text" | "pro" | "iota";

/** O-RADS: две рабочие сетки (признаки / категория) + прежние режимы. */
export function OradsProFlow() {
  const [panel, setPanel] = useState<SidePanel>(null);
  const [mode, setMode] = useState<OradsMode>("grids");

  const pushCrumb = useCallback(() => {
    /* упрощённый режим — без хлебных крошек */
  }, []);

  return (
    <div className="relative min-h-screen pb-36">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-[#0c4a6e] to-[#14b8a6] px-4 py-2.5 text-white lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/app">Рабочий кабинет</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/tools/calc">Калькуляторы</Link>
          </Button>
          <span className="text-sm font-bold">O-RADS US · ACR v2022</span>
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {mode !== "grids" ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 rounded-full text-xs"
                onClick={() => setMode("grids")}
              >
                К сеткам
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full text-xs text-white hover:bg-white/20"
                  aria-label="Другие способы расчёта O-RADS"
                >
                  Другие способы
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem onSelect={() => setMode("wizard")}>Пошаговое дерево</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setMode("pro")}>Pro + IOTA</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setMode("text")}>Из описания</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setMode("iota")}>IOTA Simple Rules</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setPanel("tables")}>Таблицы 0–5</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPanel("resources")}>Справка ACR</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ClinicalWorkspace
        className={cn((mode === "wizard" || mode === "grids") && "xl:grid-cols-[minmax(0,1fr)_300px]")}
        side={
          mode === "grids" ? (
            <>
              <FloatingInsight title="Две сетки" tone="ai">
                По признакам — считаете одно образование. По категории — сверяете монитор с учебным примером. Категорию
                ставит калькулятор ACR, не фото.
              </FloatingInsight>
              <FloatingInsight title="Не диагноз" tone="safety">
                Учебные эхограммы. Интерпретация — специалист. Без ФИО и номера карты.
              </FloatingInsight>
            </>
          ) : mode === "wizard" || mode === "text" ? (
            <>
              <FloatingInsight title="Пилотный сценарий" tone="ai">
                Пошагово, из описания или по фото: получите подсказки, подтвердите признаки и соберите черновик
                протокола. Категория считается только после проверки врача.
              </FloatingInsight>
              <FloatingInsight title="Без персональных данных" tone="safety">
                В AI-текст лучше вставлять только описание УЗИ без ФИО, телефона, адреса и номера карты.
              </FloatingInsight>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/cases?tab=cases&playlist=orads-adnexal">
                  Похожие кейсы O-RADS
                  <span aria-hidden>→</span>
                </Link>
              </Button>
            </>
          ) : null
        }
      >
        {mode === "grids" ? (
          <OradsDualGrid />
        ) : mode === "wizard" ? (
          <OradsUsWizard onOpenPro={() => setMode("pro")} />
        ) : mode === "text" ? (
          <OradsTextCalculator />
        ) : mode === "pro" ? (
          <OradsProCalculator onCrumb={pushCrumb} />
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-6 lg:px-10">
            <IotaSimpleRulesPanel />
          </div>
        )}
      </ClinicalWorkspace>

      <SpatialModal
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        title={panel === "tables" ? "Таблицы O-RADS 0–5" : "Справка"}
        description={panel === "tables" ? "Критерии и атлас для ручной проверки." : ORADS_VERSION_LABEL}
      >
        {panel === "tables" ? (
          <div className="space-y-6">
            <OradsRussianCriteriaPanel />
            <OradsCategoryAtlas />
          </div>
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
            <CalculatorLiteraturePanel slug="o-rads" compact />
          </div>
        )}
      </SpatialModal>
    </div>
  );
}
