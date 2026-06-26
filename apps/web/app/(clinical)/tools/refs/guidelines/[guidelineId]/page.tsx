import { ClinicalGuidelineDetailView } from "@/components/guidelines/ClinicalGuidelinesWidget";
import { getGuidelineById } from "@repo/clinical-guidelines";

type Props = { params: Promise<{ guidelineId: string }> };

export async function generateMetadata({ params }: Props) {
  const { guidelineId } = await params;
  const g = getGuidelineById(guidelineId);
  return {
    title: g ? `${g.title} — КР / приказы` : "Документ не найден",
  };
}

export default async function GuidelineDetailPage({ params }: Props) {
  const { guidelineId } = await params;
  return <ClinicalGuidelineDetailView guidelineId={guidelineId} />;
}
