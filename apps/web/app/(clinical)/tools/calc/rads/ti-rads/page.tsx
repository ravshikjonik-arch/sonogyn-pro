import { TiradsProFlow } from "@/components/calculators/tirads/TiradsProFlow";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/ti-rads");

const content = getCalculatorLandingContent("/tools/calc/rads/ti-rads")!;

/** Canonical RADS path — same family as O-RADS / BI-RADS / LN-RADS. */
export default function TiradsRadsPage() {
  return (
    <CalculatorLandingShell content={content}>
      <TiradsProFlow />
    </CalculatorLandingShell>
  );
}
