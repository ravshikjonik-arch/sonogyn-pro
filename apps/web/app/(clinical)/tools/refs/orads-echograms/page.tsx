import type { Metadata } from "next";

import { OradsEchogramsWidget } from "@/components/education/OradsEchogramsWidget";

export const metadata: Metadata = {
  title: "O-RADS · эхограммы и случаи",
  description:
    "Обезличенные эхограммы придатков матки из практики по нозологиям O-RADS US с готовыми формулировками для протокола.",
};

export default function OradsEchogramsPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <OradsEchogramsWidget />
      </div>
    </div>
  );
}
