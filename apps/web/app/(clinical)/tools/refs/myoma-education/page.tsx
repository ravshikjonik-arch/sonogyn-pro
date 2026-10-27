import type { Metadata } from "next";

import { MyomaCourseClient } from "@/components/education/myoma/MyomaCourseClient";
import { myomaManifest, myomaModules } from "@repo/myoma-education";

export const metadata: Metadata = {
  title: "Ультразвуковая диагностика миомы матки | SonoGyn Pro",
  description: "Учебные модули по лекции: FIGO, протокол, допплер, атлас и самопроверка.",
  robots: { index: false, follow: false },
};

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
