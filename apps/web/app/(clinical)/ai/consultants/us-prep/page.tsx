import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { UsPrepBriefingClient } from "@/components/clinical-assistant/UsPrepBriefingClient";

export const metadata = buildPublicMetadata({
  title: "Приём УЗИ · живые подсказки врачу",
  description: "Врач включает микрофон на приёме: приложение слушает жалобы и подсказывает, на что смотреть на УЗИ. Только для врача.",
  path: "/ai/consultants/us-prep",
  noindex: true,
});

export default function UsPrepBriefingPage() {
  return <UsPrepBriefingClient />;
}
