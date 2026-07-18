import Link from "next/link";
import { Award } from "lucide-react";

import { CmeTrackerClient } from "@/components/education/CmeTrackerClient";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "CME / часы обучения",
  description: "Локальный трекер часов: курсы, вебинары, quiz (ориентир AIUM/ISUOG CME).",
};

export default function CmeTrackerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/tools/refs">← Библиотека</Link>
      </Button>
      <h1 className="flex items-center gap-2 text-3xl font-semibold">
        <Award className="h-8 w-8 text-[var(--clinical-primary)]" />
        CME · часы обучения
      </h1>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">
        Трекер в духе AIUM CME Tracker — учёт часов за активности SonoGyn Pro. Формальная аккредитация НМО — отдельный этап.
      </p>
      <CmeTrackerClient />
    </div>
  );
}
