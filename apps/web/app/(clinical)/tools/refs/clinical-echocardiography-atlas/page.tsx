import type { Metadata } from "next";
import { Suspense } from "react";

import { ClinicalEchocardiographyAtlasWidget } from "@/components/education/ClinicalEchocardiographyAtlasWidget";

export const metadata: Metadata = {
  title: "Клиническая эхокардиография — учебный атлас (Otto 5ed, RU)",
  description: "44+ глав перевода Otto: лаборатория, клапаны, КМП, стресс-ЭхоКГ, ВПС, глоссарий ASE.",
};

type Props = {
  searchParams: Promise<{ section?: string; slug?: string; view?: string }>;
};

export default async function ClinicalEchocardiographyAtlasPage({ searchParams }: Props) {
  const { section, slug, view } = await searchParams;
  const initialView = view === "glossary" ? "glossary" : "chapters";

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка атласа…</p>}>
          <ClinicalEchocardiographyAtlasWidget
            initialSection={section ?? "all"}
            initialSlug={slug}
            initialView={initialView}
          />
        </Suspense>
      </div>
    </div>
  );
}
