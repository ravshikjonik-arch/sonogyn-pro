import { BishopCalculator } from "@/components/calculators/obstetric/BishopCalculator";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob/bishop");

export default function BishopPage() {
  return <BishopCalculator />;
}
