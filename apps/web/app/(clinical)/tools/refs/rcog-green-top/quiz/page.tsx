import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { RcogGreenTopQuizClient } from "@/components/education/RcogGreenTopQuizClient";

export const metadata = buildPublicMetadata({
  title: "Самопроверка · RCOG Green-top",
  description: "Quiz по маршрутам УЗИ/АГ, ориентированным на RCOG Green-top и инструменты SonoGyn. Не заменяет КР РФ.",
  path: "/tools/refs/rcog-green-top/quiz",
});

export default function RcogGreenTopQuizPage() {
  return <RcogGreenTopQuizClient />;
}
