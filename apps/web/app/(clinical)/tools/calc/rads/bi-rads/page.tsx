import { BreastBiradsHubClient } from "@/components/calculators/rads/RadsFlowClients";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/bi-rads");

const content = getCalculatorLandingContent("/tools/calc/rads/bi-rads")!;

export default function BreastBiradsPage() {
  return (
    <CalculatorLandingShell content={content}>
      <BreastBiradsHubClient />
    </CalculatorLandingShell>
  );
}
