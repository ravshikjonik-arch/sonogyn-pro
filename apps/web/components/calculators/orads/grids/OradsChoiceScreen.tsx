"use client";

import { getReferatImagePath } from "@repo/orads-us";

import { OradsGridPickCard } from "@/components/calculators/orads/grids/OradsGridPickCard";

type GridId = "features" | "category";

type Props = {
  onChoose: (grid: GridId) => void;
};

const FEATURE_IMG = getReferatImagePath("atlas/simple_cyst") ?? "/clinical/orads-nosology/functional-cyst.jpg";
const CATEGORY_IMG = "/clinical/orads-nosology/dermoid-cyst.jpg";

export function OradsChoiceScreen({ onChoose }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          O-RADS US v2022 · одно образование
        </p>
        <h2 className="mt-1 text-xl font-black text-[var(--clinical-foreground)]">Как удобнее считать?</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Два рабочих экрана. Категорию считает калькулятор ACR, не картинка. Фото — чтобы сверить монитор с типичным
          примером.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <OradsGridPickCard
          title="1. По признакам"
          hint="Какое образование → содержимое → стенка и папилляры → размер → ЦДК. Быстрый приём."
          imageSrc={FEATURE_IMG}
          imageAlt="Учебный пример простой кисты"
          onClick={() => onChoose("features")}
        />
        <OradsGridPickCard
          title="2. По категории"
          hint="Как в приложении ACR: категории 0–5, ROM и Classic Benign. Сверьте монитор с дескриптором лексикона."
          imageSrc={CATEGORY_IMG}
          imageAlt="Учебный пример дермоидной кисты"
          onClick={() => onChoose("category")}
        />
      </div>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Не является диагнозом. Интерпретация — лечащий специалист.
      </p>
    </div>
  );
}
