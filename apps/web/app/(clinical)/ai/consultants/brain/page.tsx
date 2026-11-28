import type { Metadata } from "next";
import { ClinicalBrainClient } from "@/components/clinical-assistant/ClinicalBrainClient";

export const metadata: Metadata = {
  title: "ИИ-ассистент платформы — локальный клинический мозг | SonoGyn Pro",
  description:
    "Локальный ассистент врача УЗИ: расчёты детерминированными движками, пороги из базы знаний с атрибуцией (ACR, IOTA, FIGO, FMF), чеклисты по фото, мультиход-диалог. Данные не покидают устройство. Для врачей.",
};

export default function AiConsultantsBrainPage() {
  return <ClinicalBrainClient />;
}
