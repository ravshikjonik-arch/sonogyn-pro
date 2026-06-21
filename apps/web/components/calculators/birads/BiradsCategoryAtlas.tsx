"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBiradsFlow } from "@/components/calculators/birads/BiradsFlowContext";
import { BIRADS_ATLAS_INTRO, BIRADS_CATEGORIES, pathologyImageUrl, searchPathology, type BiradsCategoryCode, type BiradsPathologyEntry } from "@/lib/birads-us";
import { cn } from "@/lib/utils/cn";

function PathologyCard({
  entry,
  onApplyQuick,
  onApplyBrochure,
}: {
  entry: BiradsPathologyEntry;
  onApplyQuick: () => void;
  onApplyBrochure: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-sm">
      <div className="relative aspect-[5/3] bg-[#1a1a2e]">
        <Image
          src={pathologyImageUrl(entry)}
          alt={entry.nameRu}
          fill
          className="object-contain p-2"
          sizes="(max-width:768px) 100vw, 400px"
        />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-[var(--clinical-primary-deep)]">{entry.nameRu}</h4>
          <span className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900">
            {entry.typicalBirads}
          </span>
        </div>
        <ul className="list-inside list-disc text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          {entry.ultrasoundAppearance.slice(0, 3).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="text-xs font-semibold">Ключевые признаки: {entry.keySigns.join("; ")}</p>
        <p className="text-xs">
          <span className="font-bold">DDx:</span> {entry.differential.join(", ")}
        </p>
        <p className="text-xs leading-relaxed">{entry.educationSummary}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          <Button type="button" size="sm" variant="secondary" className="h-7 text-[10px]" onClick={onApplyQuick}>
            → Быстрый
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={onApplyBrochure}>
            → Брошюра
          </Button>
        </div>
      </div>
    </article>
  );
}

export function BiradsCategoryAtlas() {
  const { applyPathologyPreset } = useBiradsFlow();
  const [catTab, setCatTab] = useState<BiradsCategoryCode>("3");
  const [query, setQuery] = useState("");

  const category = BIRADS_CATEGORIES.find((c) => c.code === catTab)!;
  const pathologies = useMemo(() => searchPathology(query), [query]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 lg:px-10">
      <div>
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">BI-RADS US · атлас</p>
        <h2 className="text-xl font-black">Визуальный атлас находок</h2>
        <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{BIRADS_ATLAS_INTRO}</p>
      </div>

      <Input
        placeholder="Поиск: киста, Фиброаденома, IDC…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="space-y-3">
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Категории BI-RADS</p>
        <div className="flex flex-wrap gap-1">
          {BIRADS_CATEGORIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCatTab(c.code)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                catTab === c.code
                  ? "bg-rose-600 text-white"
                  : "clinical-surface text-[var(--clinical-primary-deep)]",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-sm">
          <p className="font-bold">{category.definitionRu}</p>
          <p className="mt-1 text-xs">Риск: {category.malignancyRisk}</p>
          <p className="mt-1 text-xs">Тактика: {category.managementRu}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pathologies.map((p) => (
          <PathologyCard
            key={p.id}
            entry={p}
            onApplyQuick={() => applyPathologyPreset(p.id, "quick")}
            onApplyBrochure={() => applyPathologyPreset(p.id, "brochure")}
          />
        ))}
      </div>
    </div>
  );
}
