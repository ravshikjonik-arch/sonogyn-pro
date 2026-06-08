import { notFound } from "next/navigation";

import { NosologyRoutePageClient } from "@/components/clinical-assistant/NosologyRoutePageClient";
import {
  getAssistantCardByCode,
  type ObgynAssistantMode,
} from "@/lib/clinical-assistant";

type Props = {
  params: Promise<{ mode: string; code: string }>;
  searchParams: Promise<{ patientId?: string }>;
};

function parseMode(raw: string): ObgynAssistantMode | null {
  if (raw === "gynecology" || raw === "obstetrics") return raw;
  return null;
}

export default async function AssistantNosologyRoutePage({ params, searchParams }: Props) {
  const { mode: modeRaw, code: codeRaw } = await params;
  const { patientId } = await searchParams;
  const mode = parseMode(modeRaw);
  if (!mode) notFound();

  const code = decodeURIComponent(codeRaw).trim();
  const card = getAssistantCardByCode(mode, code);
  if (!card) notFound();

  return (
    <NosologyRoutePageClient
      card={card}
      backHref={`/assistant/${mode}`}
      initialPatientId={patientId}
    />
  );
}
