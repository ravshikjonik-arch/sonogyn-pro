import type { Metadata } from "next";
import { Suspense } from "react";

import { OvarianTumorMorphologyAtlasWidget } from "@/components/education/OvarianTumorMorphologyAtlasWidget";

export const metadata: Metadata = {
  title: "Опухоли яичника — морфологический атлас (Нейштадт, 2017)",
  description: "9 глав, 337 гистопрепаратов: эпителиальные, герминогенные, метастазы (RU, OCR).",
};

type Props = { searchParams: Promise<{ section?: string; slug?: string }> };

export default async function OvarianTumorMorphologyAtlasPage({ searchParams }: Props) {
  const { section, slug } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <OvarianTumorMorphologyAtlasWidget initialSection={section ?? "all"} initialSlug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
