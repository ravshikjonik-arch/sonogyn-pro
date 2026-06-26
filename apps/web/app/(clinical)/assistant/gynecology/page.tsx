import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ q?: string; patientId?: string }> };

export default async function LegacyAssistantGynRedirect({ searchParams }: Props) {
  const { q, patientId } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (patientId) params.set("patientId", patientId);
  const qs = params.toString();
  redirect(qs ? `/ai/consultants/gynecology?${qs}` : "/ai/consultants/gynecology");
}
