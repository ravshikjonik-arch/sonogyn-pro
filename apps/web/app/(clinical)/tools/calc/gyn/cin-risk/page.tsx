import { CinRiskCalculator } from "@/components/tools/calc/gyn/colposcopy/CinRiskCalculator";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/cin-risk");

export default function CinRiskPage() {
  return <CinRiskCalculator />;
}
