import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ studyId?: string }> };

export default async function LegacyNosologiesRedirect({ searchParams }: Props) {
  const { studyId } = await searchParams;
  redirect(studyId ? `/tools/refs/nosologies?studyId=${encodeURIComponent(studyId)}` : "/tools/refs/nosologies");
}
