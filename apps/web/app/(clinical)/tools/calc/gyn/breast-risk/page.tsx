import { BreastRiskCalculator } from "@/components/calculators/gynecologic/CancerRiskCalculators";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/breast-risk");

export default function BreastRiskPage() {
  return <BreastRiskCalculator />;
}
