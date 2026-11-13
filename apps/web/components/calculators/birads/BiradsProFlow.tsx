"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BiradsAiAssistant } from "@/components/calculators/birads/BiradsAiAssistant";
import { BiradsCategoryAtlas } from "@/components/calculators/birads/BiradsCategoryAtlas";
import { BiradsFlowProvider, useBiradsFlow } from "@/components/calculators/birads/BiradsFlowContext";
import { BiradsLymphNodesGuide } from "@/components/calculators/birads/BiradsLymphNodesGuide";
import { BiradsQuickWizard } from "@/components/calculators/birads/BiradsQuickWizard";
import { BiradsUsCalculator } from "@/components/calculators/birads/BiradsUsCalculator";
import { BreastCategoryReference, BreastUsModule } from "@/components/calculators/birads/us2025/BreastUsModule";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { Button } from "@/components/ui/button";
import { BIRADS_BROCHURE_SOURCE, generateStructuredReport } from "@/lib/birads-us";
import { cn } from "@/lib/utils/cn";

function UsCategoryReporter({ onCategoryHint }: { onCategoryHint?: (category: string | null) => void }) {
  const { input } = useBiradsFlow();
  useEffect(() => {
    if (!onCategoryHint) return;
    const report = generateStructuredReport(input);
    onCategoryHint(report.engine.category ?? null);
  }, [input, onCategoryHint]);
  return null;
}

type BiradsMode = "acr2025" | "quick" | "brochure" | "lymph" | "atlas" | "assistant";
const LEGACY_MODES: BiradsMode[] = ["quick", "brochure"];
type SidePanel = "categories" | "resources" | null;

type Props = {
  /** Внутри хаба МЖ — без дублирующей шапки «← Калькуляторы». */
  embeddedInHub?: boolean;
  /** Подсказка категории для комбо-блока (из AI / результата). */
  onCategoryHint?: (category: string | null) => void;
};

/** BI-RADS US: быстрый калькулятор + пошаговый протокол + атлас + AI Assistant. */
export function BiradsProFlow({ embeddedInHub = false, onCategoryHint }: Props) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<BiradsMode>("acr2025");
  const [panel, setPanel] = useState<SidePanel>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "acr2025" || tab === "lymph" || tab === "brochure" || tab === "atlas" || tab === "assistant" || tab === "quick") {
      setMode(tab);
    }
  }, [searchParams]);

  return (
    <BiradsFlowProvider setMode={setMode}>
      <div className={cn("relative pb-36", embeddedInHub ? "" : "min-h-screen")}>
        {LEGACY_MODES.includes(mode) ? <UsCategoryReporter onCategoryHint={onCategoryHint} /> : null}
        <div className={cn("clinical-calc-toolbar px-4 py-2.5 lg:px-10")}>
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
            {embeddedInHub ? null : (
              <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
                <Link href="/tools/calc">← Калькуляторы</Link>
              </Button>
            )}
            <span className="text-sm font-bold">
              {embeddedInHub ? "УЗИ молочных желёз · BI-RADS US" : "BI-RADS US · ACR v2025"}
            </span>
            <div className="ml-auto flex flex-wrap gap-1">
              {(
                [
                  ["acr2025", "BI-RADS УЗИ · ACR v2025"],
                  ["quick", "Быстрый (прежний)"],
                  ["brochure", "Брошюра (прежняя)"],
                  ["lymph", "Лимфоузлы"],
                  ["atlas", "Атлас"],
                  ["assistant", "AI Assistant"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  aria-pressed={mode === id}
                  variant={mode === id ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-8 rounded-full text-xs", mode !== id && "text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]")}
                  onClick={() => setMode(id)}
                >
                  {label}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]"
                onClick={() => setPanel("categories")}
              >
                Категории
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]"
                onClick={() => setPanel("resources")}
              >
                Справка
              </Button>
            </div>
          </div>
        </div>

        {mode === "acr2025" ? <BreastUsModule onCategoryHint={onCategoryHint} /> : null}
        {mode === "quick" ? <BiradsQuickWizard /> : null}
        {mode === "brochure" ? <BiradsUsCalculator embedded /> : null}
        {mode === "lymph" ? <BiradsLymphNodesGuide /> : null}
        {mode === "atlas" ? <BiradsCategoryAtlas /> : null}
        {mode === "assistant" ? <BiradsAiAssistant /> : null}

        {panel ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 lg:items-center"
            role="dialog"
            aria-modal
          >
            <div className="clinical-surface max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--clinical-border)] px-4 py-3">
                <h2 className="font-black text-[var(--clinical-primary-deep)]">
                  {panel === "categories" ? "BI-RADS 0–6" : "Справка"}
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
                  Закрыть
                </Button>
              </div>
              <div className="overflow-y-auto p-4">
                {panel === "categories" ? (
                  <BreastCategoryReference />
                ) : (
                  <div className="space-y-4 text-sm">
                    <p className="leading-relaxed">{BIRADS_BROCHURE_SOURCE}</p>
                    <p className="text-xs text-[var(--clinical-foreground-muted)]">
                      Калькулятор не заменяет ACR BI-RADS Atlas и клиническое суждение. Заключение + дисклеймер «не
                      диагноз».
                    </p>
                    <CalculatorLiteraturePanel slug="bi-rads" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </BiradsFlowProvider>
  );
}
