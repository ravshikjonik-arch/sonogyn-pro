"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";

import type { UterusLesionMarker } from "@repo/clinical-3d";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Tab = "coronal" | "sagittal" | "atlas";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "coronal", label: "Коронар · фото", hint: "Наш фото-макет · клик врача → миома / FIGO / протокол" },
  { id: "sagittal", label: "Сагиттальный · фото", hint: "Наш фото-макет · маркеры синхронны с коронаром" },
  { id: "atlas", label: "Атлас УЗИ", hint: "11 типов FIGO · учебный" },
];

const UterusLiveAnatomyPanel = dynamic(
  () => import("@/components/uterus/UterusLiveAnatomyPanel").then((m) => m.UterusLiveAnatomyPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">
        Загрузка фото-макета матки…
      </div>
    ),
  },
);

const FigoUsAtlasGallery = dynamic(
  () => import("@/components/uterus/FigoUsAtlasGallery").then((m) => m.FigoUsAtlasGallery),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">
        Загрузка атласа FIGO…
      </div>
    ),
  },
);

export function Uterus3DClientBody() {
  const [tab, setTab] = useState<Tab>("coronal");
  const [markers, setMarkers] = useState<UterusLesionMarker[]>([]);

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <Badge variant="outline">FIGO · фото-макет · клик врача</Badge>
        <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight">
          Матка — миома · классификация FIGO
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Реалистичные коронарный и сагиттальный макеты из наших клинических фото. Место узла указываете вы кликом;
          программа считает FIGO 0–8 и текст для протокола.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <Button key={t.id} variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>
              {t.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mockups">← Макеты</Link>
          </Button>
        </div>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          {TABS.find((t) => t.id === tab)?.hint}
          {markers.length > 0 ? ` · очагов: ${markers.length}` : ""}
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        {tab === "coronal" ? (
          <UterusLiveAnatomyPanel projection="coronal" markers={markers} onMarkersChange={setMarkers} />
        ) : null}
        {tab === "sagittal" ? (
          <UterusLiveAnatomyPanel projection="sagittal" markers={markers} onMarkersChange={setMarkers} />
        ) : null}
        {tab === "atlas" ? <FigoUsAtlasGallery /> : null}
      </div>

      <p className="mx-auto max-w-6xl text-center text-xs text-[var(--clinical-foreground-muted)]">
        Учебный CDS · PALM-COEIN (FIGO). Не заменяет УЗИ/МРТ. Заключение — за лечащим врачом.
      </p>
    </div>
  );
}
