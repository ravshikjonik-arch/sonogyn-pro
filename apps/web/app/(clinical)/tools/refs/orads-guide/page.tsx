import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";
import { Suspense } from "react";

import { OradsGuideWidget } from "@/components/education/OradsGuideWidget";

export const metadata = buildPublicMetadata({
  title: "O-RADS US · руководство",
  description: "Учебный реферат по классификации O-RADS US v2022 (ACR): алгоритм, клинические случаи, категории риска 0–5.",
  path: "/tools/refs/orads-guide",
});

type Props = { searchParams: Promise<{ section?: string; lang?: string }> };

export default async function OradsGuidePage({ searchParams }: Props) {
  const { section, lang } = await searchParams;
  const locale = lang === "en" ? "en" : "ru";

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>}>
          <OradsGuideWidget initialSectionId={section} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
