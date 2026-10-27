"use client";

import Link from "next/link";
import { useState } from "react";

import { ClinicalUterusWorkspace } from "@/components/three/clinical-uterus-workspace";
import { FigoUsAtlasGallery } from "@/components/uterus/FigoUsAtlasGallery";
import { UterusCoronalAtlas } from "@/components/uterus/UterusCoronalAtlas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Tab = "coronal" | "sagittal" | "atlas";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "coronal", label: "Коронарный макет", hint: "Курсор → миома / аденомиоз · FIGO" },
  { id: "sagittal", label: "Сагиттальный срез", hint: "Курсор → миома, аденомиоз, полип · авто-FIGO" },
  { id: "atlas", label: "Атлас УЗИ", hint: "11 типов FIGO · учебный" },
];

export function Uterus3DClientBody() {
  const [tab, setTab] = useState<Tab>("coronal");

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <Badge variant="outline">FIGO · рабочий и учебный режим</Badge>
        <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight">
          Матка — миома · классификация FIGO
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Макет показывает топографию узла по месту, которое указал врач. Тип FIGO считается тем же правилом, что и
          учебный калькулятор: доля интрамурального компонента от среднего диаметра. Ровно 50% — субмукозный тип 2
          или субсерозный тип 5. В гибридной записи первым идёт отношение к эндометрию, например FIGO 2–5.
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
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        {tab === "coronal" ? <UterusCoronalAtlas /> : null}
        {tab === "sagittal" ? <ClinicalUterusWorkspace /> : null}
        {tab === "atlas" ? <FigoUsAtlasGallery /> : null}
      </div>

      <p className="mx-auto max-w-6xl text-center text-xs text-[var(--clinical-foreground-muted)]">
        Учебный CDS · PALM-COEIN (FIGO). Не заменяет УЗИ/МРТ. Заключение — за лечащим врачом.
      </p>
    </div>
  );
}
