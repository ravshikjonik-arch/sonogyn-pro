import type { Metadata } from "next";
import { Suspense } from "react";

import { CervixMorphologyAtlasWidget } from "@/components/education/CervixMorphologyAtlasWidget";

export const metadata: Metadata = {
  title: "Морфологический атлас шейки матки",
  description:
    "Гистология опухолей шейки матки: CIN, AIS, карциномы, ИГХ и генетика — 17 глав, 114 препаратов.",
};

type Props = { searchParams: Promise<{ section?: string; slug?: string }> };

export default async function CervixMorphologyAtlasPage({ searchParams }: Props) {
  const { section, slug } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <CervixMorphologyAtlasWidget initialSection={section ?? "all"} initialSlug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
