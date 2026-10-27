import type { Metadata } from "next";

import { MyomaAtlasClient } from "@/components/education/myoma/MyomaAtlasClient";
import { myomaAtlas, myomaImageDimensions, myomaImageSrc, myomaModules } from "@repo/myoma-education";

export const metadata: Metadata = {
  title: "Атлас миомы матки | SonoGyn Pro",
  description: "Учебные изображения лекции по ультразвуковой диагностике миомы матки.",
  robots: { index: false, follow: false },
};

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
