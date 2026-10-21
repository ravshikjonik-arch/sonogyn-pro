import type { Metadata } from "next";
import { Suspense } from "react";

import { GynecologyImagingAtlasWidget } from "@/components/education/GynecologyImagingAtlasWidget";

export const metadata: Metadata = {
  title: "Атлас гинекологической визуализации",
  description:
    "Учебный атлас УЗИ/МРТ/КТ малого таза: 139 глав, ключевые положения и эхограммы на русском языке.",
};

type Props = { searchParams: Promise<{ section?: string; slug?: string }> };

export default async function GynecologyImagingAtlasPage({ searchParams }: Props) {
  const { section, slug } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <GynecologyImagingAtlasWidget initialSection={section ?? "all"} initialSlug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
