import { Suspense } from "react";

import { ObstetricAtlasWidget } from "@/components/education/ObstetricAtlasWidget";

type Props = { searchParams: Promise<{ part?: string; page?: string }> };

export default async function ObstetricAtlasPage({ searchParams }: Props) {
  const { part, page } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <ObstetricAtlasWidget initialPart={part ?? "all"} initialPageId={page} />
        </Suspense>
      </div>
    </div>
  );
}
