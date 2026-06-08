"use client";

import Link from "next/link";
import { useState } from "react";

import { OvaryAiAssistantPanel } from "@/components/ovary/OvaryAiAssistantPanel";
import { applyAiMarkersToOvary, OvaryUltrasoundAtlas } from "@/components/ovary/OvaryUltrasoundAtlas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OvaryMorphologyPreset, OvaryTopographyMarker } from "@repo/clinical-3d";
import { toast } from "sonner";

export function OvaryAtlasClientBody() {
  const [morphology, setMorphology] = useState<OvaryMorphologyPreset>("multifollicular");
  const [markers, setMarkers] = useState<OvaryTopographyMarker[]>([]);

  return (
    <div className="space-y-8 px-4 py-10 lg:px-10">
      <div className="sonogyn-glass-card mx-auto max-w-6xl space-y-4 rounded-3xl p-6 sm:p-8">
        <Badge variant="outline" className="border-violet-300/60 bg-violet-50/80 dark:bg-violet-950/30">
          Макет · O-RADS · ИИ-подсказка
        </Badge>
        <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
          Макет яичника
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Увеличенный яичник на приёме: отметьте фолликулы и кисты (функциональная, геморрагическая, дермоид,
          эндометриома). Загрузите фото или видео УЗИ — ИИ подскажет мультифолликулярный рисунок, норму или тип
          образования. Итоговая категория — в O-RADS Pro.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/mockups">← Все макеты</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/calculators/o-rads">O-RADS Pro →</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/uterus-3d">Макет матки</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8">
        <OvaryAiAssistantPanel
          morphology={morphology}
          markers={markers}
          onApplyAiMarkers={(side, kinds) => {
            setMarkers((prev) => applyAiMarkersToOvary(prev, side, kinds));
            toast.success("Подсказки ИИ перенесены на схему");
          }}
        />
        <OvaryUltrasoundAtlas
          morphology={morphology}
          onMorphologyChange={setMorphology}
          markers={markers}
          onMarkersChange={setMarkers}
        />
      </div>

      <p className="mx-auto max-w-6xl text-center text-xs text-[var(--clinical-foreground-muted)]">
        Учебный модуль. Не заменяет УЗИ. Заключение и O-RADS — за лечащим врачом.
      </p>
    </div>
  );
}
