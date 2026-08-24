import { notFound } from "next/navigation";

import { ENDOMETRIOMA_DEMO_ARTICLE } from "@repo/medical-knowledge";

import { ClinicalGuide } from "@/components/medical-knowledge/ClinicalGuide";

type Props = { params: Promise<{ slug: string }> };

const DEMO_ARTICLES: Record<string, typeof ENDOMETRIOMA_DEMO_ARTICLE> = {
  "endometrioma-demo": ENDOMETRIOMA_DEMO_ARTICLE,
};

export default async function ClinicalGuidePage({ params }: Props) {
  const { slug } = await params;
  const article = DEMO_ARTICLES[slug];
  if (!article) notFound();

  return (
    <ClinicalGuide
      article={article}
      relatedLinks={[
        { href: "/tools/calc/rads/o-rads", label: "O-RADS US" },
        { href: "/tools/refs/medical-knowledge", label: "Medical Knowledge Assistant" },
      ]}
    />
  );
}
