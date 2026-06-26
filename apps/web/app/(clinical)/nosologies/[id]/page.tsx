import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function LegacyNosologyRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/tools/refs/nosologies/${id}`);
}
