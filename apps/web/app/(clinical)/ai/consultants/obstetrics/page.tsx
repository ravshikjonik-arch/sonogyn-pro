import { ObgynAssistantClient } from "@/components/clinical-assistant/ObgynAssistantClient";

type Props = { searchParams: Promise<{ q?: string; patientId?: string }> };

export default async function AiConsultantsObstetricsPage({ searchParams }: Props) {
  const { q, patientId } = await searchParams;
  return <ObgynAssistantClient mode="obstetrics" initialQuery={q ?? ""} initialPatientId={patientId} />;
}
