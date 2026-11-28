import { MusaAdenomyosisClient } from "@/components/musa/MusaAdenomyosisClient";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "MUSA · Аденомиоз",
  description: "Образовательный модуль MUSA: прямые и косвенные признаки аденомиоза, JZ, Sonogyn Score, структурированный протокол.",
  path: "/musa/adenomyosis",
});

export default function MusaAdenomyosisPage() {
  return (
    <main className="container py-6">
      <MusaAdenomyosisClient />
    </main>
  );
}
