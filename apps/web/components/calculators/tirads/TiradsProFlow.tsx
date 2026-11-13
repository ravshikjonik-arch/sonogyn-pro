"use client";

import Link from "next/link";
import { useState } from "react";

import { TiradsAcrWizard } from "@/components/calculators/tirads/TiradsAcrWizard";
import { TiradsAiAssistant } from "@/components/calculators/tirads/TiradsAiAssistant";
import { TiradsEducationPanel } from "@/components/calculators/tirads/TiradsEducationPanel";
import { TiradsFlowProvider, type TiradsProMode } from "@/components/calculators/tirads/TiradsFlowContext";
import { TiradsPatternAtlas } from "@/components/calculators/tirads/TiradsPatternAtlas";
import { ThyroidTiradsModule, type ThyroidModuleTab } from "@/components/calculators/tirads/thyroid/ThyroidTiradsModule";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/** Primary tabs = new deterministic module; legacy tools stay reachable ("acr" = previous ACR wizard used by patterns / AI). */
type Mode = ThyroidModuleTab | Exclude<TiradsProMode, "ru">;

const PRIMARY: [Mode, string][] = [
  ["eu", "EU-TIRADS"],
  ["acr", "ACR TI-RADS"],
  ["compare", "Сравнение"],
  ["reference", "Справочник"],
];
const SECONDARY: [Mode, string][] = [
  ["patterns", "Паттерны"],
  ["assistant", "AI"],
  ["education", "Обучение"],
];

export function TiradsProFlow() {
  const [mode, setMode] = useState<Mode>("eu");
  const [legacyAcr, setLegacyAcr] = useState(false);
  const [literatureOpen, setLiteratureOpen] = useState(false);

  /** Patterns / AI open the previous ACR wizard with their preset. */
  const setFlowMode = (m: TiradsProMode) => {
    if (m === "acr") {
      setLegacyAcr(true);
      setMode("acr");
      return;
    }
    if (m !== "ru") setMode(m);
  };

  const tabButton = ([id, label]: [Mode, string]) => (
    <Button
      key={id}
      type="button"
      aria-pressed={mode === id}
      variant={mode === id ? "secondary" : "ghost"}
      size="sm"
      className={cn("h-8 rounded-full text-xs", mode !== id && "text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]")}
      onClick={() => {
        setMode(id);
        if (id === "acr") setLegacyAcr(false);
      }}
    >
      {label}
    </Button>
  );

  const isModuleTab = mode === "eu" || mode === "compare" || mode === "reference" || (mode === "acr" && !legacyAcr);

  return (
    <TiradsFlowProvider setMode={setFlowMode}>
      <div className="relative min-h-screen pb-36">
        <div className="clinical-calc-toolbar px-4 py-2.5 lg:px-10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
              <Link href="/tools/calc">← Калькуляторы</Link>
            </Button>
            <span className="text-sm font-bold">TI-RADS · щитовидная железа</span>
            <div className="ml-auto flex flex-wrap gap-1" role="group" aria-label="Система TI-RADS">
              {PRIMARY.map(tabButton)}
            </div>
          </div>
          <div className="mx-auto mt-1.5 flex max-w-5xl flex-wrap items-center gap-1">
            {SECONDARY.map(tabButton)}
            {mode === "acr" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]"
                onClick={() => setLegacyAcr((v) => !v)}
              >
                {legacyAcr ? "← Новый калькулятор ACR" : "Прежний мастер ACR"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]"
              onClick={() => setLiteratureOpen(true)}
            >
              Литература
            </Button>
          </div>
        </div>

        {isModuleTab ? <ThyroidTiradsModule tab={mode as ThyroidModuleTab} /> : null}
        {mode === "acr" && legacyAcr ? <TiradsAcrWizard /> : null}
        {mode === "patterns" ? <TiradsPatternAtlas /> : null}
        {mode === "assistant" ? <TiradsAiAssistant /> : null}
        {mode === "education" ? <TiradsEducationPanel /> : null}

        {literatureOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 lg:items-center" role="dialog" aria-modal>
            <div className="clinical-surface max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-4 shadow-2xl">
              <div className="mb-3 flex justify-between">
                <h2 className="font-black">Литература</h2>
                <Button variant="ghost" size="sm" onClick={() => setLiteratureOpen(false)}>
                  Закрыть
                </Button>
              </div>
              <CalculatorLiteraturePanel slug="ti-rads" />
            </div>
          </div>
        ) : null}
      </div>
    </TiradsFlowProvider>
  );
}
