import { LnRadsProFlow } from "@/components/calculators/lnrads/LnRadsProFlow";
import { SeoPageHeading } from "@/components/seo/SeoPageHeading";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/rads/ln-rads");

export default function LnRadsPage() {
  return (
    <>
      <SeoPageHeading>Калькулятор LN-RADS онлайн</SeoPageHeading>
      <LnRadsProFlow />
    </>
  );
}
