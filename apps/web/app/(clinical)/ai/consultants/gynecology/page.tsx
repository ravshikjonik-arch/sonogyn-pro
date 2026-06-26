import { ObgynAssistantClient } from "@/components/clinical-assistant/ObgynAssistantClient";

type Props = { searchParams: Promise<{ q?: string; patientId?: string }> };

export default async function AiConsultantsGynecologyPage({ searchParams }: Props) {
  const { q, patientId } = await searchParams;
  return <ObgynAssistantClient mode="gynecology" initialQuery={q ?? ""} initialPatientId={patientId} />;
}
