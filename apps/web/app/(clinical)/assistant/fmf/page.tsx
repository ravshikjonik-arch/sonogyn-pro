import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ section?: string }> };

export default async function LegacyAssistantFmfRedirect({ searchParams }: Props) {
  const { section } = await searchParams;
  redirect(section ? `/ai/consultants/fmf?section=${encodeURIComponent(section)}` : "/ai/consultants/fmf");
}
