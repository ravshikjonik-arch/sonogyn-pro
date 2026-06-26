import { NosologyListClient } from "@/components/nosology/NosologyListClient";

type Props = { searchParams: Promise<{ studyId?: string }> };

export default async function NosologiesPage({ searchParams }: Props) {
  const { studyId } = await searchParams;
  return <NosologyListClient studyId={studyId ?? null} />;
}
