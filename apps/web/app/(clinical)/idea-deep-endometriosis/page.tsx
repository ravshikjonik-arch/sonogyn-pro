import type { Metadata } from "next";

import { IdeaWorkspace } from "@/features/idea-deep-endometriosis";

export const metadata: Metadata = {
  title: "IDEA — глубокий эндометриоз",
  description: "Структурированный протокол УЗИ по IDEA (International Deep Endometriosis Analysis).",
};

export default function IdeaDeepEndometriosisPage() {
  return <IdeaWorkspace />;
}
