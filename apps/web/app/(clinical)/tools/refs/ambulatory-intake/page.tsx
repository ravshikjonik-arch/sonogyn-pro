import type { Metadata } from "next";
import { Suspense } from "react";

import { AmbulatoryVisitClient } from "@/components/ambulatory/AmbulatoryVisitClient";

export const metadata: Metadata = {
  title: "ЧЕК-ЛИСТ АМБУЛАТОРИИ",
  description:
    "ЧЕК-ЛИСТ АМБУЛАТОРИИ — интерактивный чек-лист акушера-гинеколога: сценарии, лаборатория, приказы и КР. Для врача, без персональных данных.",
  robots: { index: false, follow: false },
};

export default function AmbulatoryIntakePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <AmbulatoryVisitClient />
    </Suspense>
  );
}
