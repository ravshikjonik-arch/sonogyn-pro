import { IotaCalculatorPageClientLazy } from "@/components/calculators/rads/RadsFlowClients";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/iota");

const content = getCalculatorLandingContent("/tools/calc/rads/iota")!;

export default function IotaCalculatorPage() {
  return (
    <CalculatorLandingShell content={content}>
      <IotaCalculatorPageClientLazy />
    </CalculatorLandingShell>
  );
}
