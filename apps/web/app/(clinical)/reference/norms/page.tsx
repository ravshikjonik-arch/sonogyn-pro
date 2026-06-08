import { Suspense } from "react";

import { MedvedevNormsLookup } from "@/components/reference/MedvedevNormsLookup";

export const metadata = {
  title: "Нормы по сроку · Медведев",
  description: "Перцентили фетометрии II/III скрининга (Прил. 1, 5–12)",
};

export default function MedvedevNormsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Загрузка таблицы норм…</p>}>
      <MedvedevNormsLookup />
    </Suspense>
  );
}
