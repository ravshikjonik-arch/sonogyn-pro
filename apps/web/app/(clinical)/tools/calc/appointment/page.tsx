import { AppointmentQuickAccessHub } from "@/components/calculators/appointment/AppointmentQuickAccessHub";

export const metadata = {
  title: "Для приёма врача · Быстрый доступ к калькуляторам · SonoGyn",
  description:
    "Избранное, часто используемые, срок беременности, масса плода, Bishop, VBAC — один экран для приёма.",
};

export default function ToolsCalcAppointmentPage() {
  return <AppointmentQuickAccessHub />;
}
