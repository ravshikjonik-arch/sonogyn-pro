import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function LegacyFetalSpineIdRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/tools/refs/fetal-spine/${id}`);
}
