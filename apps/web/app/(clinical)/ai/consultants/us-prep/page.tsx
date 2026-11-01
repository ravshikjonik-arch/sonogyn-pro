import type { Metadata } from "next";

import { UsPrepBriefingClient } from "@/components/clinical-assistant/UsPrepBriefingClient";

export const metadata: Metadata = {
  title: "Приём УЗИ · живые подсказки врачу · SonoGyn Pro",
  description:
    "Врач включает микрофон на приёме: приложение слушает жалобы и подсказывает, на что смотреть на УЗИ. Только для врача.",
  robots: { index: false, follow: false },
};

export default function UsPrepBriefingPage() {
  return <UsPrepBriefingClient />;
}
