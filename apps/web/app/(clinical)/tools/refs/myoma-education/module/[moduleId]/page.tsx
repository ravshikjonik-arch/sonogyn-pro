import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MyomaModuleClient } from "@/components/education/myoma/MyomaModuleClient";
import { renderSimpleMarkdown } from "@/lib/education/simple-markdown";
import { myomaImageDimensions, myomaModules, prepareMyomaMarkdown } from "@repo/myoma-education";
import { readModuleMarkdown } from "@repo/myoma-education/server";

type Props = { params: Promise<{ moduleId: string }> };

export function generateStaticParams() {
  return myomaModules.map((module) => ({ moduleId: module.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId } = await params;
  const module = myomaModules.find((item) => item.id === moduleId);
  return {
    title: module ? `${module.title} | Миома | SonoGyn Pro` : "Модуль | SonoGyn Pro",
    robots: { index: false, follow: false },
  };
}

export default async function MyomaModulePage({ params }: Props) {
  const { moduleId } = await params;
  const index = myomaModules.findIndex((item) => item.id === moduleId);
  const module = index >= 0 ? myomaModules[index] : undefined;
  const markdown = module ? readModuleMarkdown(module.id) : null;
  if (!module || !markdown) notFound();

  const html = renderSimpleMarkdown(prepareMyomaMarkdown(markdown), {
    imageSize: (src) => {
      const file = src.split("/").pop() ?? "";
      return myomaImageDimensions[file];
    },
  });
  const prev = index > 0 ? myomaModules[index - 1] : undefined;
  const next = myomaModules[index + 1];

  return (
    <MyomaModuleClient
      moduleId={module.id}
      order={module.order}
      title={module.title}
      durationMinutes={module.durationMinutes}
      html={html}
      prev={prev ? { id: prev.id, title: prev.title } : null}
      next={next ? { id: next.id, title: next.title } : null}
    />
  );
}
