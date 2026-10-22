import { PregnancyMedicationsReference } from "@/components/calculators/reference/PregnancyMedicationsReference";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob/pregnancy-medications");

export default function PregnancyMedicationsPage() {
  return <PregnancyMedicationsReference />;
}
