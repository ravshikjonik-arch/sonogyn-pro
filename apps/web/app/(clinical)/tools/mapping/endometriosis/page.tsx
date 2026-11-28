import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { IdeaWorkspace } from "@/features/idea-deep-endometriosis";

export const metadata = buildPublicMetadata({
  title: "IDEA — глубокий эндометриоз",
  description: "Структурированный протокол УЗИ по IDEA (International Deep Endometriosis Analysis).",
  path: "/tools/mapping/endometriosis",
});

export default function EndometriosisMappingPage() {
  return <IdeaWorkspace />;
}
