import { BishopCalculator } from "@/components/calculators/obstetric/BishopCalculator";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/ob/bishop");

const content = getCalculatorLandingContent("/tools/calc/ob/bishop")!;

export default function BishopPage() {
  return (
    <CalculatorLandingShell content={content}>
      <BishopCalculator />
    </CalculatorLandingShell>
  );
}
