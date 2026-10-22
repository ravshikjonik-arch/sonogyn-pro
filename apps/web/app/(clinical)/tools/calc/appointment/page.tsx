import { AppointmentQuickAccessHub } from "@/components/calculators/appointment/AppointmentQuickAccessHub";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/appointment");

export default function ToolsCalcAppointmentPage() {
  return <AppointmentQuickAccessHub />;
}
