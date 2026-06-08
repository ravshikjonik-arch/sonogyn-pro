"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClinicalUterusWorkspace } from "@/components/three/clinical-uterus-workspace";
import { UterusCoronalAtlas } from "@/components/uterus/UterusCoronalAtlas";

type Tab = "coronal" | "sagittal";

export function Uterus3DClientBody() {
  const [tab, setTab] = useState<Tab>("coronal");

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <Badge variant="outline">Макет · FIGO · протокол</Badge>
        <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight">
          Матка — выбор места образования
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Коронарный макет (ваше изображение): клик или контур — программа формирует локализацию и FIGO для миомы.
          Сагиттальный срез — для детальной разметки миомы, аденомиоза, полипа (как раньше).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={tab === "coronal" ? "default" : "outline"} onClick={() => setTab("coronal")}>
            Коронарный макет
          </Button>
          <Button variant={tab === "sagittal" ? "default" : "outline"} onClick={() => setTab("sagittal")}>
            Сагиттальный срез
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mockups">← Все макеты</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/breast-3d">Макет МЖ →</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {tab === "coronal" ? <UterusCoronalAtlas /> : <ClinicalUterusWorkspace />}
      </div>

      <p className="mx-auto max-w-6xl text-center text-xs text-[var(--clinical-foreground-muted)]">
        Учебный модуль. Не заменяет УЗИ/МРТ. Заключение — за лечащим врачом.
      </p>
    </div>
  );
}
