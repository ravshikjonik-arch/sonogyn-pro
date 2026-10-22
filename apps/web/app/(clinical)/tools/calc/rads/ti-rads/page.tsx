import { TiradsProFlow } from "@/components/calculators/tirads/TiradsProFlow";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/rads/ti-rads");

/** Canonical RADS path — same family as O-RADS / BI-RADS / LN-RADS. */
export default function TiradsRadsPage() {
  return <TiradsProFlow />;
}
