"use client";

import Link from "next/link";
import { useState } from "react";

import { TiradsAcrWizard } from "@/components/calculators/tirads/TiradsAcrWizard";
import { TiradsAiAssistant } from "@/components/calculators/tirads/TiradsAiAssistant";
import { TiradsEducationPanel } from "@/components/calculators/tirads/TiradsEducationPanel";
import { TiradsFlowProvider } from "@/components/calculators/tirads/TiradsFlowContext";
import { TiradsPatternAtlas } from "@/components/calculators/tirads/TiradsPatternAtlas";
import { TiradsRuFlow } from "@/components/calculators/tirads-ru/TiradsRuFlow";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { Button } from "@/components/ui/button";
import { TIRADS_CATEGORIES, ACR_TIRADS_VERSION } from "@/lib/tirads-acr";
import { cn } from "@/lib/utils/cn";

type Mode = "acr" | "patterns" | "assistant" | "education" | "ru";
type Panel = "categories" | "literature" | null;

export function TiradsProFlow() {
  const [mode, setMode] = useState<Mode>("acr");
  const [panel, setPanel] = useState<Panel>(null);

  return (
    <TiradsFlowProvider setMode={setMode}>
      <div className="relative min-h-screen pb-36">
        <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-sky-950 to-cyan-600 px-4 py-2.5 text-white lg:px-10">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
              <Link href="/calculators">← Калькуляторы</Link>
            </Button>
            <span className="text-sm font-bold">{ACR_TIRADS_VERSION}</span>
            <div className="ml-auto flex flex-wrap gap-1">
              {(
                [
                  ["acr", "ACR Score"],
                  ["patterns", "Patterns"],
                  ["assistant", "AI"],
                  ["education", "Обучение"],
                  ["ru", "РФ 2023"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant={mode === id ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-8 rounded-full text-xs", mode !== id && "text-white hover:bg-white/20")}
                  onClick={() => setMode(id)}
                >
                  {label}
                </Button>
              ))}
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-xs text-white hover:bg-white/20" onClick={() => setPanel("categories")}>
                TR1–5
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-xs text-white hover:bg-white/20" onClick={() => setPanel("literature")}>
                Справка
              </Button>
            </div>
          </div>
        </div>

        {mode === "acr" ? <TiradsAcrWizard /> : null}
        {mode === "patterns" ? <TiradsPatternAtlas /> : null}
        {mode === "assistant" ? <TiradsAiAssistant /> : null}
        {mode === "education" ? <TiradsEducationPanel /> : null}
        {mode === "ru" ? <TiradsRuFlow embedded /> : null}

        {panel ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 lg:items-center" role="dialog" aria-modal>
            <div className="clinical-surface max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-4 shadow-2xl">
              <div className="mb-3 flex justify-between">
                <h2 className="font-black">{panel === "categories" ? "ACR TI-RADS TR1–5" : "Литература"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setPanel(null)}>Закрыть</Button>
              </div>
              {panel === "categories"
                ? TIRADS_CATEGORIES.map((c) => (
                    <div key={c.code} className="mb-2 rounded-lg border p-2 text-sm">
                      <p className="font-bold">{c.label}</p>
                      <p className="text-xs">{c.definitionRu}</p>
                    </div>
                  ))
                : <CalculatorLiteraturePanel slug="ti-rads" />}
            </div>
          </div>
        ) : null}
      </div>
    </TiradsFlowProvider>
  );
}
