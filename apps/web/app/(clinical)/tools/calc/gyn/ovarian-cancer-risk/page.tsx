import { OvarianCancerRiskCalculator } from "@/components/calculators/gynecologic/CancerRiskCalculators";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/ovarian-cancer-risk");

export default function OvarianCancerRiskPage() {
  return <OvarianCancerRiskCalculator />;
}
