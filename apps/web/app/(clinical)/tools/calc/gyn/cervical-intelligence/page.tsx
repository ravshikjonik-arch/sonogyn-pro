import { CpiDashboard } from "@/components/tools/calc/gyn/colposcopy/CpiDashboard";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/cervical-intelligence");

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
