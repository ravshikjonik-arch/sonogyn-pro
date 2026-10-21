import type { Metadata } from "next";
import { Suspense } from "react";

import { ObstetricsImagingAtlasWidget } from "@/components/education/ObstetricsImagingAtlasWidget";

export const metadata: Metadata = {
  title: "Атлас акушерской визуализации",
  description:
    "Учебный атлас УЗИ/МРТ в акушерстве: 313 глав, ключевые положения и эхограммы на русском языке (Woodward 4ed).",
};

type Props = { searchParams: Promise<{ section?: string; slug?: string }> };

export default async function ObstetricsImagingAtlasPage({ searchParams }: Props) {
  const { section, slug } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <ObstetricsImagingAtlasWidget initialSection={section ?? "all"} initialSlug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
