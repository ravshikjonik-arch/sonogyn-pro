import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";

import { CaseLibraryClient } from "@/components/education/CaseLibraryClient";
import { CASE_LIBRARY_BUNDLES, CASE_LIBRARY_TOTAL } from "@/lib/education/case-library/bundles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Teaching Case Library · Radiopaedia-style",
  description:
    "Curated bundles учебных кейсов: fetal anatomy, O-RADS, set-pieces, vascular, cervix, community cases.",
};

export default function CaseLibraryPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/tools/refs">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Библиотека
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Radiopaedia-style</Badge>
              <Badge variant="outline">{CASE_LIBRARY_BUNDLES.length} подборок</Badge>
              <Badge variant="outline">~{CASE_LIBRARY_TOTAL}+ cases</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Library className="h-8 w-8 text-[var(--clinical-primary)]" />
              Teaching Case Library
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Curated bundles из модулей SonoGyn Pro: от 22 срезов и O-RADS до set-pieces и кейсов сообщества с
              аннотациями на снимках.
            </p>
          </div>
        </header>
        <CaseLibraryClient />
      </div>
    </div>
  );
}
