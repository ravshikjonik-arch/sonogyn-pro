import { Suspense } from "react";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { MedvedevNormsLookup } from "@/components/reference/MedvedevNormsLookup";

export const metadata = buildPublicMetadata({
  title: "Нормы по сроку",
  description: "Перцентили фетометрии II/III скрининга (Прил. 1, 5–12)",
  path: "/tools/refs/consensus",
});

export default function MedvedevNormsPage() {
  return (
    <div className="space-y-4">
      <h1 className="sr-only">Нормы по сроку · фетометрия II/III скрининга</h1>
      <Suspense fallback={<p className="p-8 text-sm">Загрузка таблицы норм…</p>}>
        <MedvedevNormsLookup />
      </Suspense>
    </div>
  );
}
