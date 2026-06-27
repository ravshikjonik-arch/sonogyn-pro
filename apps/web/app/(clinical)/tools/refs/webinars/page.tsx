import type { Metadata } from "next";

import { WebinarHubClient } from "@/components/webinars/WebinarHubClient";

export const metadata: Metadata = {
  title: "Вебинары · SonoGyn Pro",
  description: "Прямые эфиры и записи для врачей. Платный доступ, чат с лектором.",
};

export default function WebinarsPage() {
  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--clinical-primary-deep)]">
          Обучение · прямой эфир
        </p>
        <h1 className="text-3xl font-black tracking-tight">Вебинары</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Прямой эфир и записи внутри SonoGyn Pro — как в Zoom, но в вашем приложении. Доступ после оплаты курса,
          чат с лектором обязателен на каждом эфире.
        </p>
      </div>
      <div className="mx-auto max-w-6xl">
        <WebinarHubClient />
      </div>
    </div>
  );
}
