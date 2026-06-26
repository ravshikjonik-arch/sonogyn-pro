import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ mode: string; code: string }>;
  searchParams: Promise<{ patientId?: string }>;
};

export default async function LegacyAssistantRouteRedirect({ params, searchParams }: Props) {
  const { mode, code } = await params;
  const { patientId } = await searchParams;
  const qs = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
  redirect(`/ai/consultants/${mode}/${encodeURIComponent(code)}${qs}`);
}
