import { Suspense } from "react";

import { ClinicalReferenceReader } from "@/components/reference/ClinicalReferenceReader";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Клинические нормы УЗИ",
  description: "Методики измерений и ориентиры для протоколов УЗИ в акушерстве и гинекологии.",
  path: "/tools/refs/norms",
});

const content = getCalculatorLandingContent("/tools/refs/norms")!;

export default function ReferencePage() {
  return (
    <CalculatorLandingShell content={content}>
      <Suspense fallback={<p className="p-8 text-sm">Загрузка справочника…</p>}>
        <ClinicalReferenceReader />
      </Suspense>
    </CalculatorLandingShell>
  );
}
