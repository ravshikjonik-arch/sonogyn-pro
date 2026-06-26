import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function LegacyAssistantVascularRedirect({ searchParams }: Props) {
  const { tab } = await searchParams;
  redirect(tab ? `/ai/consultants/vascular?tab=${encodeURIComponent(tab)}` : "/ai/consultants/vascular");
}
