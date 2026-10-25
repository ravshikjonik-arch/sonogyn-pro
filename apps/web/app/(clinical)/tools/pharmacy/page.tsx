import { DoctorPharmacy } from "@/components/pharmacy/DoctorPharmacy";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/pharmacy");

export default function DoctorPharmacyPage() {
  return <DoctorPharmacy />;
}
