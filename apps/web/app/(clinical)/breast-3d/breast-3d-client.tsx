"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import { BreastTopographyAtlas } from "@/components/breast/BreastTopographyAtlas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Breast3dPreview = dynamic(
  () => import("./breast-3d-preview").then((m) => ({ default: m.Breast3dPreview })),
  { ssr: false, loading: () => <p className="py-8 text-center text-sm text-slate-500">Загрузка 3D…</p> },
);

export function Breast3DClientBody() {
  const [show3d, setShow3d] = useState(false);

  return (
    <div className="space-y-8 px-4 py-10 lg:px-10">
      <div className="sonogyn-glass-card sonogyn-hero-orbs sonogyn-enter mx-auto max-w-6xl space-y-4 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-pink-300/50 bg-pink-50/80 dark:bg-pink-950/30">
            Схема · BI-RADS
          </Badge>
          <span className="sonogyn-shimmer-bar h-1 w-16 rounded-full opacity-80" aria-hidden />
        </div>
        <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
          Макет молочной железы
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Как топография FIGO у матки: схема обеих грудей, клик или обводка очага — программа формирует
          локализацию для протокола: <strong>квадрант, часы, см от соска</strong> (например: 10 см, 9 часов).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/calculators/bi-rads">BI-RADS US →</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShow3d((v) => !v)}>
            {show3d ? "Схема (2D)" : "3D-просмотр (учебный)"}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mockups">← Все макеты</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/uterus-3d">Макет матки →</Link>
          </Button>
        </div>
      </div>

      <div className="sonogyn-enter sonogyn-enter-delay-1 mx-auto max-w-6xl">
        <BreastTopographyAtlas />
      </div>

      {show3d ? <Breast3dPreview /> : null}

      <p className="mx-auto max-w-6xl text-center text-xs text-[var(--clinical-foreground-muted)]">
        Интерпретация — на усмотрение специалиста. Не является диагнозом.
      </p>
    </div>
  );
}
