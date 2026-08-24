import { PatientListClient } from "@/components/patients/PatientListClient";

export const metadata = {
  title: "Пациенты",
  robots: { index: false, follow: false },
};

export default function PatientsPage() {
  return <PatientListClient />;
}
