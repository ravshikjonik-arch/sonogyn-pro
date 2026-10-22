import { IotaCalculatorPageClient } from "@/components/calculators/iota/IotaCalculatorPageClient";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/iota");

export default function IotaCalculatorPage() {
  return <IotaCalculatorPageClient />;
}
