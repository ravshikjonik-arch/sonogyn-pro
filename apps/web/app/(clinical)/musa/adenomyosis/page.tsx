import { MusaAdenomyosisClient } from "@/components/musa/MusaAdenomyosisClient";

export const metadata = {
  title: "MUSA · Аденомиоз | SonoGyn Pro",
  description:
    "Образовательный модуль MUSA: прямые и косвенные признаки аденомиоза, JZ, Sonogyn Score, структурированный протокол.",
};

export default function MusaAdenomyosisPage() {
  return (
    <main className="container py-6">
      <MusaAdenomyosisClient />
    </main>
  );
}
