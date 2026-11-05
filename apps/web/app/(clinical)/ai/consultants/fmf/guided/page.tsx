import { GuidedProtocolWizard } from "@/components/clinical-assistant/GuidedProtocolWizard";

export const metadata = {
  title: "Протокол по сроку · SonoGyn Guided",
  description:
    "Пошаговый пренатальный протокол УЗИ по сроку беременности: что смотреть и измерять по очереди.",
};

export default function FmfGuidedProtocolPage() {
  return <GuidedProtocolWizard />;
}
