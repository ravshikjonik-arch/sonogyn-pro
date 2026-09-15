"use client";

import { useState } from "react";
import type { OradsCategoryPhotoCard, OradsNosologySubtype } from "@repo/orads-us";

import { OradsCategoryGrid } from "@/components/calculators/orads/grids/OradsCategoryGrid";
import { OradsChoiceScreen } from "@/components/calculators/orads/grids/OradsChoiceScreen";
import { OradsFeatureGrid } from "@/components/calculators/orads/grids/OradsFeatureGrid";
import { Button } from "@/components/ui/button";
import type { UnilocularSubtype } from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

type GridView = "choose" | "features" | "category";

function asUnilocularSubtype(subtype: OradsNosologySubtype | undefined): UnilocularSubtype | undefined {
  if (!subtype) return undefined;
  if (subtype === "free_fluid" || subtype === "orads5_ovarian_cancer") return undefined;
  return subtype as UnilocularSubtype;
}

export function OradsDualGrid() {
  const [view, setView] = useState<GridView>("choose");
  const [seedSubtype, setSeedSubtype] = useState<UnilocularSubtype | undefined>();

  function openFeatures(card?: OradsCategoryPhotoCard) {
    setSeedSubtype(asUnilocularSubtype(card?.subtype));
    setView("features");
  }

  return (
    <div>
      {view !== "choose" ? (
        <div className="mx-auto flex max-w-3xl flex-wrap gap-2 px-4 pt-4 lg:px-10">
          <Button type="button" size="sm" variant="ghost" onClick={() => setView("choose")}>
            Обе сетки
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "features" ? "default" : "outline"}
            className={cn(view === "features" && "pointer-events-none")}
            onClick={() => setView("features")}
          >
            По признакам
          </Button>
          <Button type="button" size="sm" variant={view === "category" ? "default" : "outline"} onClick={() => setView("category")}>
            По категории
          </Button>
        </div>
      ) : null}

      {view === "choose" ? <OradsChoiceScreen onChoose={setView} /> : null}
      {view === "features" ? <OradsFeatureGrid key={seedSubtype ?? "blank"} initialSubtype={seedSubtype} /> : null}
      {view === "category" ? <OradsCategoryGrid onUseInCalculator={openFeatures} /> : null}
    </div>
  );
}
