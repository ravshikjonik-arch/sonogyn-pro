import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { MyomaAtlasClient } from "@/components/education/myoma/MyomaAtlasClient";
import { myomaAtlas, myomaImageDimensions, myomaImageSrc, myomaModules } from "@repo/myoma-education";

export const metadata = buildPublicMetadata({
  title: "Атлас миомы матки",
  description: "Учебные изображения лекции по ультразвуковой диагностике миомы матки.",
  path: "/tools/refs/myoma-education/atlas",
});

export default function MyomaAtlasPage() {
  const items = myomaAtlas.map((item) => {
    const file = item.image.split("/").pop() ?? "";
    const size = myomaImageDimensions[file] ?? { width: 800, height: 600 };
    return {
      id: item.id,
      title: item.title,
      alt: item.alt,
      moduleId: item.module,
      src: myomaImageSrc(item.image),
      width: size.width,
      height: size.height,
    };
  });

  return (
    <MyomaAtlasClient
      items={items}
      modules={myomaModules.map((module) => ({ id: module.id, title: module.title }))}
    />
  );
}
