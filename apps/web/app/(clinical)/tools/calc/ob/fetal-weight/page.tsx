import { FetalWeightCalculator } from "@/components/calculators/obstetric/FetalWeightCalculator";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob/fetal-weight");

export default function FetalWeightPage() {
  return <FetalWeightCalculator />;
}
