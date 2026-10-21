import type { Metadata } from "next";
import { Suspense } from "react";

import { PrenatalEchographyAtlasWidget } from "@/components/education/PrenatalEchographyAtlasWidget";

export const metadata: Metadata = {
  title: "Пренатальная эхография — учебный атлас",
  description: "20 глав, 725 эхограмм: фетометрия, допpler, пороки плода (RU).",
};

type Props = { searchParams: Promise<{ section?: string; slug?: string }> };

export default async function PrenatalEchographyAtlasPage({ searchParams }: Props) {
  const { section, slug } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <PrenatalEchographyAtlasWidget initialSection={section ?? "all"} initialSlug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
