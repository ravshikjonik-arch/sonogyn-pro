import { CervicalCancerRiskCalculator } from "@/components/calculators/gynecologic/CancerRiskCalculators";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/cervical-cancer-risk");

export default function CervicalCancerRiskPage() {
  return <CervicalCancerRiskCalculator />;
}
