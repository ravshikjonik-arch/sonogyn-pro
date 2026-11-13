import { TiradsProFlow } from "@/components/calculators/tirads/TiradsProFlow";
import { SeoPageHeading } from "@/components/seo/SeoPageHeading";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/rads/ti-rads");

/** Canonical RADS path — same family as O-RADS / BI-RADS / LN-RADS. */
export default function TiradsRadsPage() {
  return (
    <>
      <SeoPageHeading>Калькулятор TI-RADS ACR онлайн</SeoPageHeading>
      <TiradsProFlow />
    </>
  );
}
