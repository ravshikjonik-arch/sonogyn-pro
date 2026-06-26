import { BiradsProFlow } from "@/components/calculators/birads/BiradsProFlow";

export const metadata = {
  title: "BI-RADS US · SonoGyn",
  description: "Калькулятор BI-RADS US: быстрый режим, брошюра v2025, визуальный атлас, AI Assistant.",
};

export default function BiradsUsPage() {
  return <BiradsProFlow />;
}
