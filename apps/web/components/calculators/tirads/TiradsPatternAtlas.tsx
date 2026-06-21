"use client";

import { useMemo, useState } from "react";

import { TiradsAtlasImage } from "@/components/calculators/tirads/TiradsAtlasImage";
import { useTiradsFlow } from "@/components/calculators/tirads/TiradsFlowContext";
import { CalcChip } from "@/components/calculators/shared/calc-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  searchPatterns,
  TIRADS_ATLAS_INTRO,
  type ThyroidPatternEntry,
} from "@/lib/tirads-acr";

function PatternCard({ entry, onApply }: { entry: ThyroidPatternEntry; onApply: () => void }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-sm">
      <div className="relative aspect-[5/3] bg-[#0f172a]">
        <TiradsAtlasImage imageFile={entry.imageFile} alt={entry.nameRu} />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex justify-between gap-2">
          <h4 className="text-sm font-bold">{entry.nameRu}</h4>
          <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900">{entry.typicalTirads}</span>
        </div>
        <ul className="list-inside list-disc text-xs text-[var(--clinical-foreground-muted)]">
          {entry.ultrasoundAppearance.slice(0, 3).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="text-xs">{entry.educationSummary}</p>
        <Button type="button" size="sm" className="h-7 text-xs" onClick={onApply}>
          Применить паттерн
        </Button>
      </div>
    </article>
  );
}

/** Thyroid Pattern Recognition — библиотека эхокартин. */
export function TiradsPatternAtlas() {
  const { applyPattern } = useTiradsFlow();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | "benign" | "borderline" | "malignant">("all");
  const patterns = useMemo(() => {
    let list = searchPatterns(query);
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    return list;
  }, [query, cat]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 lg:px-10">
      <h2 className="text-xl font-black">Thyroid Pattern Recognition</h2>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">{TIRADS_ATLAS_INTRO}</p>
      <Input placeholder="Поиск: PTC, colloid, spongiform…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" />
      <div className="flex flex-wrap gap-1">
        {(["all", "benign", "borderline", "malignant"] as const).map((c) => (
          <CalcChip
            key={c}
            label={c === "all" ? "Все" : c === "benign" ? "Доброкач." : c === "borderline" ? "Погранич." : "Злокач."}
            selected={cat === c}
            onClick={() => setCat(c)}
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {patterns.map((p) => (
          <PatternCard key={p.id} entry={p} onApply={() => applyPattern(p.id)} />
        ))}
      </div>
    </div>
  );
}
