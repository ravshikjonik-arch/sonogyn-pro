import { VbacCalculator } from "@/components/calculators/obstetric/VbacCalculator";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob/vbac");

export default function VbacPage() {
  return <VbacCalculator />;
}
