"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BiradsCombinedPanel } from "@/components/calculators/birads/BiradsCombinedPanel";
import { BiradsMmgCalculator } from "@/components/calculators/birads/BiradsMmgCalculator";
import { BiradsProFlow } from "@/components/calculators/birads/BiradsProFlow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type BreastModality = "us" | "mmg" | "combo";

/**
 * Хаб МЖ · BI-RADS для врачей:
 * отдельные блоки УЗИ молочных желёз | ММГ | Комбо.
 */
export function BreastBiradsHub() {
  const searchParams = useSearchParams();
  const modalityFromUrl = searchParams.get("modality");
  const [modality, setModality] = useState<BreastModality>(() =>
    modalityFromUrl === "us" || modalityFromUrl === "mmg" || modalityFromUrl === "combo"
      ? modalityFromUrl
      : "us",
  );
  const [usCategory, setUsCategory] = useState<string | null>(null);
  const [mmgCategory, setMmgCategory] = useState<string | null>(null);

  useEffect(() => {
    const m = searchParams.get("modality");
    if (m === "us" || m === "mmg" || m === "combo") setModality(m);
  }, [searchParams]);

  const selectModality = useCallback((next: BreastModality) => {
    setModality(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("modality", next);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const onMmgCategory = useCallback((category: string) => {
    setMmgCategory(category);
  }, []);

  return (
    <div className="relative min-h-screen pb-24">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-[#4c0519] to-[#be123c] px-4 py-3 text-white lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
              <Link href="/tools/calc">← Калькуляторы</Link>
            </Button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Для врачей</p>
              <h1 className="text-base font-black sm:text-lg">Молочные железы · BI-RADS</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["us", "УЗИ молочных желёз"],
                ["mmg", "ММГ молочных желёз"],
                ["combo", "Комбо УЗИ + ММГ"],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                variant={modality === id ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-9 rounded-full text-xs", modality !== id && "text-white hover:bg-white/20")}
                onClick={() => selectModality(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-white/85">
            Два независимых лексикона ACR (US и Mammography) + комбинированное заключение. CDS, не диагноз.
          </p>
        </div>
      </div>

      {modality === "us" ? (
        <BiradsProFlow
          embeddedInHub
          onCategoryHint={(cat) => {
            if (cat) setUsCategory(cat);
          }}
        />
      ) : null}
      {modality === "mmg" ? <BiradsMmgCalculator onCategoryChange={onMmgCategory} /> : null}
      {modality === "combo" ? (
        <BiradsCombinedPanel
          usCategory={usCategory}
          mmgCategory={mmgCategory}
          onGoUs={() => selectModality("us")}
          onGoMmg={() => selectModality("mmg")}
        />
      ) : null}
    </div>
  );
}
