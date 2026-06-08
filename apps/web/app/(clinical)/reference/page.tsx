import { Suspense } from "react";

import { ClinicalReferenceReader } from "@/components/reference/ClinicalReferenceReader";

export const metadata = {
  title: "Клинические нормы УЗИ",
  description: "Методики измерений и ориентиры для протоколов",
};

export default function ReferencePage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Загрузка справочника…</p>}>
      <ClinicalReferenceReader />
    </Suspense>
  );
}
