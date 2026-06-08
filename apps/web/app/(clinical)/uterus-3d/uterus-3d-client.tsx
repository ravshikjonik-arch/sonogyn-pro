"use client";

import { Badge } from "@/components/ui/badge";

import { ClinicalUterusWorkspace } from "@/components/three/clinical-uterus-workspace";

export function Uterus3DClientBody() {
  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-3">
        <Badge variant="outline">Procedure planning · education</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Сагиттальный срез матки
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Статическая схема продольного разреза с шейкой (как на атласе). Отмечайте миому, аденомиоз, полип и рубец —
          текст для протокола формируется автоматически. Учебный модуль, не замена УЗИ/МРТ.
        </p>
      </div>
      <div className="mx-auto max-w-6xl">
        <ClinicalUterusWorkspace />
      </div>
    </div>
  );
}
