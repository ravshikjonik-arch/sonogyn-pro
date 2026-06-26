import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ patientId?: string; studyId?: string }>;
};

export default async function LegacyCpiRedirect({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.patientId) q.set("patientId", sp.patientId);
  if (sp.studyId) q.set("studyId", sp.studyId);
  const qs = q.toString();
  redirect(qs ? `/tools/calc/gyn/cervical-intelligence?${qs}` : "/tools/calc/gyn/cervical-intelligence");
}
