import { IotaCalculatorPageClient } from "@/components/calculators/iota/IotaCalculatorPageClient";
import { CalculatorSourceBadge } from "@/components/calculators/CalculatorSourceBadge";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/iota");

const content = getCalculatorLandingContent("/tools/calc/rads/iota")!;

export default function IotaCalculatorPage() {
  return (
    <CalculatorLandingShell content={content}>
      <IotaCalculatorPageClient />
      <CalculatorSourceBadge
        title="Timmerman et al. (2010) — IOTA ADNEX"
        reference="BMJ 341:c3611 · коэффициенты модели ADNEX"
        organization="IOTA"
        verified="Сверено 25.11.2026 · коэффициенты совпадают с BMJ 2014/2010 · юнит-тесты ✓"
      />
    </CalculatorLandingShell>
  );
}
