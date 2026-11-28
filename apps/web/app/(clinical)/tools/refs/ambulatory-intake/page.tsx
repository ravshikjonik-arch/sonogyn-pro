import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";
import { Suspense } from "react";

import { AmbulatoryVisitClient } from "@/components/ambulatory/AmbulatoryVisitClient";

export const metadata = buildPublicMetadata({
  title: "ЧЕК-ЛИСТ АМБУЛАТОРИИ",
  description: "ЧЕК-ЛИСТ АМБУЛАТОРИИ — интерактивный чек-лист акушера-гинеколога: сценарии, лаборатория, приказы и КР. Для врача, без персональных данных.",
  path: "/tools/refs/ambulatory-intake",
  noindex: true,
});

export default function AmbulatoryIntakePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <AmbulatoryVisitClient />
    </Suspense>
  );
}
