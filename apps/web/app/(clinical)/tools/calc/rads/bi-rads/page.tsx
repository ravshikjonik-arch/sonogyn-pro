import { Suspense } from "react";

import { BreastBiradsHub } from "@/components/calculators/birads/BreastBiradsHub";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/bi-rads");

const content = getCalculatorLandingContent("/tools/calc/rads/bi-rads")!;

export default function BreastBiradsPage() {
  return (
    <CalculatorLandingShell content={content}>
      <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
        <BreastBiradsHub />
      </Suspense>
    </CalculatorLandingShell>
  );
}
