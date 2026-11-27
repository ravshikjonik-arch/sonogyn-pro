import type { Metadata } from "next";
import { Suspense } from "react";

import { UsScanPlanesAtlasWidget } from "@/components/education/UsScanPlanesAtlasWidget";

export const metadata: Metadata = {
  title: "Плоскости сканирования и позиционирование датчика — атлас",
  description:
    "Учебный атлас УЗ-плоскостей: схема датчика и изображение на экране (голова, живот, таз, конечности).",
};

type Props = { searchParams: Promise<{ section?: string; slug?: string }> };

export default async function UsScanPlanesAtlasPage({ searchParams }: Props) {
  const { section, slug } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <UsScanPlanesAtlasWidget initialSection={section ?? "all"} initialSlug={slug} />
        </Suspense>
      </div>
    </div>
  );
}