import { redirect } from "next/navigation";

type Props = { params: Promise<{ guidelineId: string }> };

export default async function LegacyGuidelineRedirect({ params }: Props) {
  const { guidelineId } = await params;
  redirect(`/tools/refs/guidelines/${guidelineId}`);
}
