import { IotaCalculatorPageClient } from "@/components/calculators/iota/IotaCalculatorPageClient";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/iota");

const content = getCalculatorLandingContent("/tools/calc/rads/iota")!;

export default function IotaCalculatorPage() {
  return (
    <CalculatorLandingShell content={content}>
      <IotaCalculatorPageClient />
    </CalculatorLandingShell>
  );
}
