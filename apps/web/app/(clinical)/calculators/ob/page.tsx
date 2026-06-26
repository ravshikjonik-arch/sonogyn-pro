import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ tab?: string }> };

/** Legacy path — canonical IA v2: /tools/calc/ob */
export default async function LegacyObRedirect({ searchParams }: Props) {
  const { tab } = await searchParams;
  redirect(tab ? `/tools/calc/ob?tab=${encodeURIComponent(tab)}` : "/tools/calc/ob");
}
