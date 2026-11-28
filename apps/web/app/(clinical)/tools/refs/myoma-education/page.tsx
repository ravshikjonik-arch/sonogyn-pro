import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { MyomaCourseClient } from "@/components/education/myoma/MyomaCourseClient";
import { myomaManifest, myomaModules } from "@repo/myoma-education";

export const metadata = buildPublicMetadata({
  title: "Ультразвуковая диагностика миомы матки",
  description: "Учебные модули по лекции: FIGO, протокол, допплер, атлас и самопроверка.",
  path: "/tools/refs/myoma-education",
});

export default function MyomaEducationPage() {
  return (
    <MyomaCourseClient
      title={myomaManifest.title}
      modules={myomaModules.map((module) => ({
        id: module.id,
        order: module.order,
        title: module.title,
        durationMinutes: module.durationMinutes,
      }))}
    />
  );
}
