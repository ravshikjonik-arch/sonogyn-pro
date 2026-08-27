"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { OradsCategoryAtlas } from "@/components/calculators/orads/OradsCategoryAtlas";
import { OradsProCalculator } from "@/components/calculators/orads/OradsProCalculator";
import { OradsRussianCriteriaPanel } from "@/components/calculators/orads/OradsRussianCriteriaPanel";
import { OradsTextCalculator } from "@/components/calculators/orads/OradsTextCalculator";
import { OradsUsWizard } from "@/components/calculators/orads/wizard/OradsUsWizard";
import { IotaSimpleRulesPanel } from "@/components/calculators/orads/IotaSimpleRulesPanel";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { ClinicalWorkspace, FloatingInsight, SpatialModal } from "@/components/spatial";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  ORADS_ECHOGRAMS_LIBRARY_PATH,
  ORADS_US_CLINICAL_BULLETS,
  ORADS_US_PRIMARY_SOURCES,
} from "@repo/adnex-education";

import { ORADS_GOVERNING_BULLETS, ORADS_VERSION_LABEL } from "@/lib/orads-pro";

type SidePanel = "tables" | "resources" | null;
type OradsMode = "wizard" | "text" | "pro" | "iota";

/** O-RADS: пошаговое дерево (orads-us) + расширенный Pro (чипы / IOTA). */
export function OradsProFlow() {
  const [panel, setPanel] = useState<SidePanel>(null);
  const [mode, setMode] = useState<OradsMode>("wizard");

  const pushCrumb = useCallback(() => {
    /* упрощённый режим — без хлебных крошек */
  }, []);

  return (
    <div className="relative min-h-screen pb-36">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-[#0c4a6e] to-[#14b8a6] px-4 py-2.5 text-white lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/app">Command Center</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/tools/calc">Калькуляторы</Link>
          </Button>
          <span className="text-sm font-bold">O-RADS US · ACR v2022</span>
          <div className="ml-auto flex gap-1">
            <Button
              type="button"
              variant={mode === "wizard" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-full text-xs", mode !== "wizard" && "text-white hover:bg-white/20")}
              onClick={() => setMode("wizard")}
            >
              Пошаговый
            </Button>
            <Button
              type="button"
              variant={mode === "text" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-full text-xs", mode !== "text" && "text-white hover:bg-white/20")}
              onClick={() => setMode("text")}
            >
              По тексту
            </Button>
            <Button
              type="button"
              variant={mode === "pro" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-full text-xs", mode !== "pro" && "text-white hover:bg-white/20")}
              onClick={() => setMode("pro")}
            >
              Pro + IOTA
            </Button>
            <Button
              type="button"
              variant={mode === "iota" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-full text-xs", mode !== "iota" && "text-white hover:bg-white/20")}
              onClick={() => setMode("iota")}
            >
              IOTA B/M
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs text-white hover:bg-white/20"
              onClick={() => setPanel("tables")}
            >
              Таблицы
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs text-white hover:bg-white/20"
              onClick={() => setPanel("resources")}
            >
              Справка
            </Button>
          </div>
        </div>
      </div>

      <ClinicalWorkspace
        className={cn(mode === "wizard" && "xl:grid-cols-[minmax(0,1fr)_300px]")}
        side={
          mode === "wizard" || mode === "text" ? (
            <>
              <FloatingInsight title="Пилотный сценарий" tone="ai">
                Пошагово · из описания · по фото → подсказки в wizard → черновик протокола. Категория — из O-RADS
                engine после подтверждения врача.
              </FloatingInsight>
              <FloatingInsight title="Без PHI" tone="safety">
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
        {mode === "wizard" ? (
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
