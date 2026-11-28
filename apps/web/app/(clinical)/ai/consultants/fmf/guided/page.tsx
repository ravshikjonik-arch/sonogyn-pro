import { GuidedProtocolWizard } from "@/components/clinical-assistant/GuidedProtocolWizard";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Протокол по сроку · SonoGyn",
  description:
    "Пошаговый пренатальный протокол УЗИ по сроку беременности: что смотреть и измерять по очереди.",
  path: "/ai/consultants/fmf/guided",
});

export default function FmfGuidedProtocolPage() {
  return <GuidedProtocolWizard />;
}