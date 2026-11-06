import type { Metadata } from "next";

import { RcogGreenTopQuizClient } from "@/components/education/RcogGreenTopQuizClient";

export const metadata: Metadata = {
  title: "Самопроверка · RCOG Green-top | SonoGyn Pro",
  description:
    "Quiz по маршрутам УЗИ/АГ, ориентированным на RCOG Green-top и инструменты SonoGyn. Не заменяет КР РФ.",
};

export default function RcogGreenTopQuizPage() {
  return <RcogGreenTopQuizClient />;
}
