import { EndometriumCalculator } from "@/components/calculators/endometrium/EndometriumCalculator";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/endometrium");

export default function EndometriumCalculatorPage() {
  return (
    <>
      <EndometriumCalculator />
      <div className="mx-auto max-w-4xl px-4 pb-10">
        <CalculatorLiteraturePanel slug="endometrium" />
      </div>
    </>
  );
}
