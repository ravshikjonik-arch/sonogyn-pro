import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ shelf?: string }> };

export default async function LegacyEvidenceRedirect({ searchParams }: Props) {
  const { shelf } = await searchParams;
  redirect(shelf ? `/tools/refs/evidence?shelf=${encodeURIComponent(shelf)}` : "/tools/refs/evidence");
}
