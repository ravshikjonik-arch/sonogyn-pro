import { CpiDashboard } from "@/components/calculators/colposcopy/CpiDashboard";

export const metadata = {
  title: "Cervical Pathology Intelligence · SonoGyn",
  description: "CPI: IFCPC + HPV + Bethesda + Swede + Risk + CDS + Reports — ASCCP/WHO/ESGO.",
};

type Props = {
  searchParams: Promise<{ patientId?: string; studyId?: string }>;
};

export default async function CervicalIntelligencePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <CpiDashboard
      initialPatientId={sp.patientId}
      initialStudyId={sp.studyId}
    />
  );
}
