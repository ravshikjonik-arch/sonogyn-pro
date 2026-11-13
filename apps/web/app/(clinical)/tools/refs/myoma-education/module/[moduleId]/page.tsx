import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MyomaModuleClient } from "@/components/education/myoma/MyomaModuleClient";
import { renderSimpleMarkdown } from "@/lib/education/simple-markdown";
import { myomaImageDimensions, myomaModules, prepareMyomaMarkdown } from "@repo/myoma-education";
import { readModuleMarkdown } from "@repo/myoma-education/server";

type Props = { params: Promise<{ moduleId: string }> };

export function generateStaticParams() {
  return myomaModules.map((mod) => ({ moduleId: mod.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = myomaModules.find((item) => item.id === moduleId);
  return {
    title: mod ? `${mod.title} | Миома | SonoGyn Pro` : "Модуль | SonoGyn Pro",
    robots: { index: false, follow: false },
  };
}

export default async function MyomaModulePage({ params }: Props) {
  const { moduleId } = await params;
  const index = myomaModules.findIndex((item) => item.id === moduleId);
  const mod = index >= 0 ? myomaModules[index] : undefined;
  const markdown = mod ? readModuleMarkdown(mod.id) : null;
  if (!mod || !markdown) notFound();

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
      moduleId={mod.id}
      order={mod.order}
      title={mod.title}
      durationMinutes={mod.durationMinutes}
      html={html}
      prev={prev ? { id: prev.id, title: prev.title } : null}
      next={next ? { id: next.id, title: next.title } : null}
    />
  );
}
