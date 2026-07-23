"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBiradsFlow } from "@/components/calculators/birads/BiradsFlowContext";
import { BIRADS_ATLAS_INTRO, BIRADS_CATEGORIES, pathologyImageUrl, searchPathology, type BiradsCategoryCode, type BiradsPathologyEntry } from "@/lib/birads-us";
import { cn } from "@/lib/utils/cn";

const CATEGORY_COLORS: Record<BiradsCategoryCode, string> = {
  "0": "bg-slate-100 text-slate-800 border-slate-300",
  "1": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "2": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "3": "bg-amber-100 text-amber-900 border-amber-300",
  "4A": "bg-orange-100 text-orange-900 border-orange-300",
  "4B": "bg-orange-100 text-orange-900 border-orange-300",
  "4C": "bg-rose-100 text-rose-900 border-rose-300",
  "5": "bg-rose-200 text-rose-950 border-rose-400",
  "6": "bg-violet-100 text-violet-900 border-violet-300",
};

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
        {entry.realExampleImage && (
          <span className="absolute left-2 top-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            Реальная эхограмма
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-[var(--clinical-primary-deep)]">{entry.nameRu}</h4>
          <span className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900">
            {entry.typicalBirads}
          </span>
        </div>
        {entry.realExampleCaption && (
          <p className="rounded-md bg-emerald-50 px-2 py-1 text-xs italic leading-relaxed text-emerald-900">
            {entry.realExampleCaption}
          </p>
        )}
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
        {catTab === "5" ? (
          <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm">
            <p className="text-sm font-black text-rose-900">BI-RADS 5 · Высокий риск · премиум-пример</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {["/images/breast/idc.svg", "/images/breast/ilc.svg", "/images/breast/fibroadenoma_cyst_example.jpg"].map((src, idx) => (
                <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-rose-200 bg-black/5">
                  <Image src={src} alt={`BI-RADS 5 пример ${idx + 1}`} fill className="object-contain" sizes="(max-width:768px) 50vw, 200px" />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs italic text-rose-900">Обучающие иллюстрации BI-RADS 5. Не заменяют врачебное заключение.</p>
          </div>
        ) : null}
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
