import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ q?: string }> };

/** Старый URL помощника → единое окно Неотложка · СМП. */
export default async function AiConsultantsEmergencyRedirect({ searchParams }: Props) {
  const { q } = await searchParams;
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  redirect(`/tools/emergency${qs}`);
}
