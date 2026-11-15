import type { Metadata } from "next";

import { BiradsUsQuizClient } from "@/components/education/BiradsUsQuizClient";

export const metadata: Metadata = {
  title: "Самопроверка · BI-RADS US | SonoGyn Pro",
  description:
    "Quiz по US BI-RADS: категории ACR, лексикон, мультипараметр. Справочно для специалистов, не диагноз.",
};

export default function BiradsUsQuizPage() {
  return <BiradsUsQuizClient />;
}
