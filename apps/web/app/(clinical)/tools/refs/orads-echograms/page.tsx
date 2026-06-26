import type { Metadata } from "next";
import { Suspense } from "react";

import { OradsEchogramsWidget } from "@/components/education/OradsEchogramsWidget";

export const metadata: Metadata = {
  title: "O-RADS · эхограммы и случаи",
  description:
    "Библиотека эхограмм придатков матки для O-RADS US: учебные снимки и клинические случаи по нозологиям.",
};

type Props = { searchParams: Promise<{ chapter?: string; page?: string }> };

export default async function OradsEchogramsPage({ searchParams }: Props) {
  const { chapter, page } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>}>
          <OradsEchogramsWidget initialChapter={chapter ?? "all"} initialPageId={page} />
        </Suspense>
      </div>
    </div>
  );
}
