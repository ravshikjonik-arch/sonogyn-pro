"use client";

import Link from "next/link";
import { useState } from "react";

import { LnRadsAcademyPanel } from "@/components/calculators/lnrads/LnRadsAcademyPanel";
import { LnRadsAiAssistant, LnRadsCaseLibrary } from "@/components/calculators/lnrads/LnRadsAiAssistant";
import { LnRadsAnatomyMap, LnRadsBoardTrainer } from "@/components/calculators/lnrads/LnRadsAnatomyMap";
import { LnRadsFlowProvider, type LnRadsMode } from "@/components/calculators/lnrads/LnRadsFlowContext";
import { LnRadsMorphologyAtlas } from "@/components/calculators/lnrads/LnRadsMorphologyAtlas";
import { LnRadsQuickWizard } from "@/components/calculators/lnrads/LnRadsQuickWizard";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LN_RADS_CATEGORIES, LN_RADS_VERSION, searchGlossary } from "@/lib/ln-rads-us";
import { cn } from "@/lib/utils/cn";

type SidePanel = "categories" | "glossary" | "literature" | null;

const MODES: { id: LnRadsMode; label: string }[] = [
  { id: "calculator", label: "LN-RADS" },
  { id: "atlas", label: "Atlas" },
  { id: "academy", label: "Academy" },
  { id: "assistant", label: "AI Pattern" },
  { id: "anatomy", label: "Mapping" },
  { id: "cases", label: "Cases" },
  { id: "board", label: "Board" },
];

export function LnRadsProFlow() {
  const [mode, setMode] = useState<LnRadsMode>("calculator");
  const [panel, setPanel] = useState<SidePanel>(null);
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const glossaryHits = searchGlossary(glossaryQuery);

  return (
    <LnRadsFlowProvider setMode={setMode}>
      <div className="relative min-h-screen pb-36">
        <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-teal-900 to-emerald-500 px-4 py-2.5 text-white lg:px-10">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
              <Link href="/tools/calc">← Калькуляторы</Link>
            </Button>
            <span className="text-sm font-bold">LN-RADS US Intelligence Suite</span>
            <div className="ml-auto flex flex-wrap gap-1">
              {MODES.map(({ id, label }) => (
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
                LN 1–5
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-xs text-white hover:bg-white/20" onClick={() => setPanel("glossary")}>
                Glossary
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-xs text-white hover:bg-white/20" onClick={() => setPanel("literature")}>
                Справка
              </Button>
            </div>
          </div>
        </div>

        {mode === "calculator" ? <LnRadsQuickWizard /> : null}
        {mode === "atlas" ? <LnRadsMorphologyAtlas /> : null}
        {mode === "academy" ? <LnRadsAcademyPanel /> : null}
        {mode === "assistant" ? <LnRadsAiAssistant /> : null}
        {mode === "anatomy" ? <LnRadsAnatomyMap /> : null}
        {mode === "cases" ? <LnRadsCaseLibrary /> : null}
        {mode === "board" ? <LnRadsBoardTrainer /> : null}

        {panel ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 lg:items-center" role="dialog" aria-modal>
            <div className="clinical-surface max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--clinical-border)] px-4 py-3">
                <h2 className="font-black text-[var(--clinical-primary-deep)]">
                  {panel === "categories" ? "LN-RADS 1–5" : panel === "glossary" ? "Glossary" : "Справка"}
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
                  Закрыть
                </Button>
              </div>
              <div className="overflow-y-auto p-4">
                {panel === "categories" ? (
                  <div className="space-y-3">
                    {LN_RADS_CATEGORIES.map((c) => (
                      <div key={c.code} className="rounded-xl border border-[var(--clinical-border)] p-3 text-sm">
                        <p className="font-black">{c.label}</p>
                        <p className="mt-1 text-xs">{c.definitionRu}</p>
                        <p className="mt-1 text-xs font-bold">Риск: {c.malignancyRisk}</p>
                        <p className="text-xs">{c.managementRu}</p>
                        <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
                          US: {c.ultrasoundCriteria.slice(0, 2).join("; ")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : panel === "glossary" ? (
                  <div className="space-y-3">
                    <Input value={glossaryQuery} onChange={(e) => setGlossaryQuery(e.target.value)} placeholder="Hilum, L/S, ECE…" />
                    {glossaryHits.map((g) => (
                      <div key={g.term} className="rounded-lg border p-2 text-sm">
                        <p className="font-bold">{g.term}{g.termEn ? ` (${g.termEn})` : ""}</p>
                        <p className="text-xs">{g.definitionRu}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <p className="leading-relaxed">{LN_RADS_VERSION}</p>
                    <p className="text-xs text-[var(--clinical-foreground-muted)]">
                      LN-RADS US SonoGyn Pro синтезирует критерии EFSUMB, WFUMB, ATA, AIUM, SRU, ESR. Заключение не является диагнозом — интерпретация за специалистом.
                    </p>
                    <CalculatorLiteraturePanel slug="ln-rads" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </LnRadsFlowProvider>
  );
}
