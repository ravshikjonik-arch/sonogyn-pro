import { redirect } from "next/navigation";

type Props = { params: Promise<{ path?: string[] }> };

export default async function AiConsultantsCatchAllPage({ params }: Props) {
  const { path = [] } = await params;
  if (path.length === 0) redirect("/assistant");
  redirect(`/assistant/${path.join("/")}`);
}
