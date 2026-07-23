import { Suspense } from "react";

import { BreastBiradsHub } from "@/components/calculators/birads/BreastBiradsHub";

export const metadata = {
  title: "МЖ · BI-RADS УЗИ и ММГ · SonoGyn",
  description:
    "Молочные железы для врачей: отдельные блоки УЗИ (BI-RADS US) и маммографии (BI-RADS Mammography) + комбинированное заключение.",
};

export default function BreastBiradsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <BreastBiradsHub />
    </Suspense>
  );
}
