import type { Metadata } from "next";
import { Suspense } from "react";

import { MammologyNationalAtlasWidget } from "@/components/education/MammologyNationalAtlasWidget";

export const metadata: Metadata = {
  title: "Маммология: национальное руководство",
  description:
    "Учебный атлас Каприн–Рожкова: 26 глав, OCR-текст, развороты скана и подписи рисунков для BI-RADS и УЗИ МЖ.",
};

type Props = { searchParams: Promise<{ section?: string; slug?: string }> };

export default async function MammologyNationalAtlasPage({ searchParams }: Props) {
  const { section, slug } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <MammologyNationalAtlasWidget initialSection={section ?? "all"} initialSlug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
