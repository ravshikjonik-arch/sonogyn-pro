import { LnRadsProFlow } from "@/components/calculators/lnrads/LnRadsProFlow";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/rads/ln-rads");

export default function LnRadsPage() {
  return <LnRadsProFlow />;
}
